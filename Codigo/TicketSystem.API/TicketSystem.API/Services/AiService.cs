using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Serilog;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using TicketSystem.API.Data;
using TicketSystem.API.Models.DTOs;
using TicketSystem.API.Services.Interfaces;

namespace TicketSystem.API.Services
{
    public class AiService : IAiService
    {
        private readonly ApplicationDbContext _db;
        private readonly IConfiguration _config;
        private readonly IHttpClientFactory _httpClientFactory;

        public AiService(ApplicationDbContext db, IConfiguration config, IHttpClientFactory httpClientFactory)
        {
            _db = db;
            _config = config;
            _httpClientFactory = httpClientFactory;
        }

        public async Task<AiAnalyzeResponse> AnalyzeAsync(AiAnalyzeRequest request, CancellationToken ct = default)
        {
            // If Gemini is configured, try using it first; fallback to heuristics on error
            var apiKey = _config["Gemini:ApiKey"];
            var model = _config["Gemini:Model"] ?? "gemini-1.5-flash";

            if (!string.IsNullOrWhiteSpace(apiKey))
            {
                try
                {
                    var gemini = _httpClientFactory.CreateClient();

                    // Try multiple model and endpoint variants for best compatibility
                    var models = new[] { model, $"{model}-latest", "gemini-1.5-pro-latest", "gemini-1.5-pro", "gemini-1.5-flash-latest", "gemini-1.5-flash" }
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .ToArray();
                    var endpoints = new List<string>();
                    foreach (var m in models)
                    {
                        endpoints.Add($"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={Uri.EscapeDataString(apiKey)}");
                        endpoints.Add($"https://generativelanguage.googleapis.com/v1/models/{m}:generateContent?key={Uri.EscapeDataString(apiKey)}");
                    }

                    var depts = await _db.Departments.AsNoTracking().ToListAsync(ct);
                    var depList = string.Join(", ", depts.Select(d => d.Name));
                    var prompt = new StringBuilder();
                    prompt.AppendLine("Você é um assistente para triagem de chamados de TI.\n");
                    prompt.AppendLine("Dados do ticket:");
                    prompt.AppendLine($"Título: {request.Title}");
                    prompt.AppendLine($"Descrição: {request.Description}\n");
                    if (request.DoneActions is { Count: > 0 })
                    {
                        prompt.AppendLine("Ações já realizadas pelo usuário (NÃO sugerir novamente):");
                        foreach (var a in request.DoneActions.Distinct()) prompt.AppendLine("- " + a);
                        prompt.AppendLine();
                    }
                    if (request.RejectedActions is { Count: > 0 })
                    {
                        prompt.AppendLine("Ações rejeitadas/que não ajudaram (EVITAR repetir):");
                        foreach (var a in request.RejectedActions.Distinct()) prompt.AppendLine("- " + a);
                        prompt.AppendLine();
                    }
                    if (request.PriorSuggestions is { Count: > 0 })
                    {
                        prompt.AppendLine("Sugestões anteriores já mostradas:");
                        foreach (var s in request.PriorSuggestions.Distinct()) prompt.AppendLine("- " + s);
                        prompt.AppendLine();
                    }
                    prompt.AppendLine("Departamentos disponíveis (escolha um pelo NOME exato):");
                    prompt.AppendLine(depList);
                    prompt.AppendLine("\nRegras:");
                    prompt.AppendLine("- Gere sugestões PASSO-A-PASSO objetivas e verificáveis.");
                    prompt.AppendLine("- NÃO repita nada que já foi feito/rejeitado/mostrado.");
                    prompt.AppendLine("- Se faltar informação, faça perguntas objetivas de diagnóstico.");
                    prompt.AppendLine("- Caso aplicável, indique o melhor próximo passo ('nextAction').");
                    prompt.AppendLine("\nRetorne APENAS um JSON com as chaves:");
                    prompt.AppendLine("{ suggestions: string[], predictedDepartmentName?: string, confidence?: number, priorityHint?: 'critica'|'alta'|'media'|'baixa', rationale?: string, nextAction?: string, followUpQuestions?: string[] }");
                    prompt.AppendLine("Não inclua texto fora do JSON.");

                    var body = new
                    {
                        contents = new[]
                        {
                            new
                            {
                                role = "user",
                                parts = new[] { new { text = prompt.ToString() } }
                            }
                        },
                        generationConfig = new { temperature = 0.2 }
                    };

                    HttpResponseMessage? respMsg = null;
                    Exception? lastEx = null;
                    foreach (var endpoint in endpoints)
                    {
                        try
                        {
                            using var reqMsg = new HttpRequestMessage(HttpMethod.Post, endpoint)
                            {
                                Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json")
                            };
                            Log.Information("Calling Gemini endpoint {Endpoint}", endpoint);
                            respMsg = await gemini.SendAsync(reqMsg, ct);
                            if (respMsg.IsSuccessStatusCode)
                            {
                                break;
                            }
                            lastEx = new HttpRequestException($"Gemini endpoint {endpoint} returned {(int)respMsg.StatusCode} {respMsg.ReasonPhrase}");
                        }
                        catch (Exception ex)
                        {
                            lastEx = ex;
                        }
                    }
                    if (respMsg == null)
                    {
                        throw lastEx ?? new HttpRequestException("Failed to call Gemini endpoint");
                    }
                    respMsg.EnsureSuccessStatusCode();
                    using var stream = await respMsg.Content.ReadAsStreamAsync(ct);
                    using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct);
                    // Some responses split across multiple parts; join all text parts
                    var parts = doc.RootElement
                        .GetProperty("candidates")[0]
                        .GetProperty("content")
                        .GetProperty("parts")
                        .EnumerateArray()
                        .Select(p => p.TryGetProperty("text", out var t) ? (t.GetString() ?? string.Empty) : string.Empty)
                        .Where(s => !string.IsNullOrWhiteSpace(s));
                    var modelText = string.Join("\n", parts);

                    if (!string.IsNullOrWhiteSpace(modelText))
                    {
                        // The model returns JSON as text; handle markdown fences and extract JSON
                        var jsonText = ExtractJson(modelText);
                        var json = JsonDocument.Parse(jsonText);
                        var root = json.RootElement;
                        var result = new AiAnalyzeResponse { Source = "gemini" };
                        if (root.TryGetProperty("suggestions", out var sug) && sug.ValueKind == JsonValueKind.Array)
                        {
                            result.Suggestions = sug.EnumerateArray().Select(x => x.GetString() ?? string.Empty).Where(s => !string.IsNullOrWhiteSpace(s)).Distinct().Take(5).ToList();
                        }
                        if (root.TryGetProperty("predictedDepartmentName", out var depNameEl))
                        {
                            var depName = depNameEl.GetString();
                            if (!string.IsNullOrWhiteSpace(depName))
                            {
                                var match = depts.FirstOrDefault(d => string.Equals(d.Name, depName, StringComparison.OrdinalIgnoreCase));
                                if (match != null)
                                {
                                    result.PredictedDepartmentId = match.Id;
                                    result.PredictedDepartmentName = match.Name;
                                }
                            }
                        }
                        if (root.TryGetProperty("confidence", out var confEl) && confEl.TryGetDouble(out var conf))
                        {
                            result.Confidence = Math.Clamp(conf, 0, 1);
                        }
                        if (root.TryGetProperty("priorityHint", out var priEl))
                        {
                            var p = priEl.GetString();
                            if (!string.IsNullOrWhiteSpace(p)) result.PriorityHint = p;
                        }
                        if (root.TryGetProperty("rationale", out var ratEl))
                        {
                            result.Rationale = ratEl.GetString();
                        }
                        if (root.TryGetProperty("nextAction", out var nextEl))
                        {
                            result.NextAction = nextEl.GetString();
                        }
                        if (root.TryGetProperty("followUpQuestions", out var qEl) && qEl.ValueKind == JsonValueKind.Array)
                        {
                            result.FollowUpQuestions = qEl.EnumerateArray().Select(x => x.GetString() ?? string.Empty).Where(s => !string.IsNullOrWhiteSpace(s)).Distinct().Take(5).ToList();
                        }

                        // If Gemini returned something meaningful, return it; else fallback
                        if ((result.Suggestions?.Count ?? 0) > 0 || result.PredictedDepartmentId.HasValue)
                        {
                            Log.Information("AI (Gemini) ok | model={Model} dep={Dept} conf={Conf}", model, result.PredictedDepartmentName, result.Confidence);
                            return result;
                        }
                    }
                }
                catch (Exception ex)
                {
                    Log.Warning(ex, "Gemini analyze failed, falling back to heuristics");
                }
            }

            // Adaptive heuristic fallback (no per-problem hardcoded suggestions)
            var text = ($"{request.Title} {request.Description}").ToLowerInvariant();
            var resp = new AiAnalyzeResponse { Source = "heuristic" };

            var done = new HashSet<string>((request.DoneActions ?? new()).Where(s => !string.IsNullOrWhiteSpace(s)), StringComparer.OrdinalIgnoreCase);
            var rejected = new HashSet<string>((request.RejectedActions ?? new()).Where(s => !string.IsNullOrWhiteSpace(s)), StringComparer.OrdinalIgnoreCase);
            var prior = new HashSet<string>((request.PriorSuggestions ?? new()).Where(s => !string.IsNullOrWhiteSpace(s)), StringComparer.OrdinalIgnoreCase);

            // Extract basic signals from the text
            bool hasErrorCode = Regex.IsMatch(text, @"\b(erro|error|exce(c|ç)ao|exception|codigo|código|0x[0-9a-f]+|\d{3,})\b");
            bool mentionsNetwork = Regex.IsMatch(text, @"\b(rede|internet|wifi|ethernet|vpn|dns|gateway)\b");
            bool mentionsAccess = Regex.IsMatch(text, @"\b(acesso|login|senha|permiss|autentic|sso|ldap|ad)\b");
            bool mentionsEmail = Regex.IsMatch(text, @"\b(email|e-mail|outlook|gmail|exchange)\b");
            bool mentionsBrowser = Regex.IsMatch(text, @"\b(navegador|chrome|edge|firefox|safari|cache|cookie|extens(oes|ões))\b");
            bool mentionsDevice = Regex.IsMatch(text, @"\b(mouse|teclado|monitor|usb|webcam|headset|microfone|dispositivo|perif(erico|érico))\b");
            bool mentionsApp = Regex.IsMatch(text, @"\b(app|aplica(c|ç)ao|sistema|cliente|atualiza(c|ç)ao|vers(ao|ão))\b");

            // Candidate step generators (templates with slight variation)
            List<string> candidates = new();
            void Add(params string[] steps) => candidates.AddRange(steps.Where(s => !string.IsNullOrWhiteSpace(s)));

            // General triage steps
            Add(
                "Detalhe quando o problema começou e se ocorre sempre ou intermitente",
                "Teste se o problema ocorre em outro usuário ou computador para isolar",
                "Informe o impacto no negócio (quem/quantos afetados)"
            );
            if (!hasErrorCode)
            {
                Add("Copie/cole a mensagem de erro exata (texto ou print)");
            }

            if (mentionsNetwork)
            {
                Add(
                    "Execute ping para o gateway e para um site externo para diferenciar LAN/Internet",
                    "Se possível, teste via cabo e Wi‑Fi para comparar",
                    "Renove o IP e limpe DNS (ipconfig /renew e ipconfig /flushdns)"
                );
            }
            if (mentionsAccess)
            {
                Add(
                    "Confirme se o usuário está ativo e com permissões corretas",
                    "Sincronize/redefina a senha e aguarde replicação",
                    "Verifique bloqueios por tentativas falhas (AD/SSO)"
                );
            }
            if (mentionsEmail)
            {
                Add(
                    "Verifique cota da caixa e tamanho de anexos",
                    "Abra o cliente em modo seguro e desative complementos",
                    "Teste acesso via webmail para comparar"
                );
            }
            if (mentionsBrowser)
            {
                Add(
                    "Limpe cache/cookies e teste em janela anônima",
                    "Desative extensões para descartar interferências",
                    "Compare em outro navegador para isolar"
                );
            }
            if (mentionsDevice)
            {
                Add(
                    "Teste o dispositivo em outra porta ou computador",
                    "Reinstale/atualize o driver do dispositivo",
                    "Verifique cabos/alimentação e conexões físicas"
                );
            }
            if (mentionsApp)
            {
                Add(
                    "Confirme versão do aplicativo e compatibilidade",
                    "Reproduza o erro seguindo passos mínimos e registre",
                    "Consulte logs do aplicativo para mensagens relacionadas"
                );
            }

            // Rank and filter: remove anything done/rejected/prior and dedupe
            var unique = candidates
                .Where(s => !done.Contains(s) && !rejected.Contains(s) && !prior.Contains(s))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Take(7)
                .ToList();

            // If nothing left, ask clarifying questions
            if (unique.Count == 0)
            {
                unique.AddRange(new[]
                {
                    "Envie a mensagem de erro completa e o horário aproximado da ocorrência",
                    "Informe se outros usuários também são afetados ou somente você",
                }.Where(s => !prior.Contains(s)));
            }

            resp.Suggestions = unique.Take(5).ToList();
            resp.NextAction = resp.Suggestions.FirstOrDefault();
            resp.FollowUpQuestions = new List<string>();
            if (!hasErrorCode) resp.FollowUpQuestions.Add("Qual é a mensagem de erro exata apresentada?");
            resp.FollowUpQuestions.Add("O problema ocorre em outros usuários/dispositivos?");

            // Predict department based on keywords matched to existing departments
            var departments = await _db.Departments.AsNoTracking().ToListAsync(ct);
            var depScore = new Dictionary<int, int>();
            foreach (var d in departments)
            {
                int score = 0;
                var name = d.Name.ToLowerInvariant();
                var desc = (d.Description ?? string.Empty).ToLowerInvariant();
                if (text.Contains("fatura") || text.Contains("pagamento") || text.Contains("boleto") || text.Contains("nota fiscal"))
                {
                    if (name.Contains("finance") || desc.Contains("finance")) score += 3;
                }
                if (text.Contains("venda") || text.Contains("cliente") || text.Contains("pedido") || text.Contains("comercial"))
                {
                    if (name.Contains("comercial") || name.Contains("vendas") || desc.Contains("comercial")) score += 3;
                }
                if (text.Contains("rede") || text.Contains("sistema") || text.Contains("ti") || text.Contains("bug") || text.Contains("impressora"))
                {
                    if (name.Contains("suporte") || name.Contains("técnico") || desc.Contains("bug")) score += 3;
                }
                if (text.Contains("mouse") || text.Contains("teclado") || text.Contains("periferico") || text.Contains("periférico"))
                {
                    if (name.Contains("suporte") || name.Contains("técnico") || desc.Contains("técnico")) score += 2;
                }
                if (score > 0) depScore[d.Id] = depScore.GetValueOrDefault(d.Id) + score;
            }

            if (depScore.Count > 0)
            {
                var best = depScore.OrderByDescending(kv => kv.Value).First();
                var dept = departments.First(d => d.Id == best.Key);
                resp.PredictedDepartmentId = dept.Id;
                resp.PredictedDepartmentName = dept.Name;
                resp.Confidence = Math.Min(0.9, 0.5 + 0.1 * best.Value);
                resp.Rationale = $"Classificação por palavras-chave encontradas para '{dept.Name}'.";
            }

            // Priority hint based on urgency words
            if (Regex.IsMatch(text, @"\b(parado|urgente|critico|crítico|inacessível|inacessivel)\b"))
            {
                resp.PriorityHint = "critica";
            }
            else if (Regex.IsMatch(text, @"\b(importante|falhando|instavel|instável|intermitente)\b"))
            {
                resp.PriorityHint = "alta";
            }
            Log.Information("AI (heuristic) used | dep={Dept} conf={Conf}", resp.PredictedDepartmentName, resp.Confidence);
            return resp;
        }

        private static string ExtractJson(string input)
        {
            var s = input.Trim();
            // Remove markdown code fences
            s = s.Replace("```json", string.Empty).Replace("```", string.Empty).Trim();
            if (s.StartsWith("{") && s.EndsWith("}")) return s;
            // Attempt to find first balanced JSON object
            int start = s.IndexOf('{');
            if (start < 0) throw new FormatException("No JSON object found in model output.");
            int depth = 0;
            for (int i = start; i < s.Length; i++)
            {
                if (s[i] == '{') depth++;
                else if (s[i] == '}')
                {
                    depth--;
                    if (depth == 0)
                    {
                        return s.Substring(start, i - start + 1);
                    }
                }
            }
            throw new FormatException("Unbalanced JSON braces in model output.");
        }
    }
}
