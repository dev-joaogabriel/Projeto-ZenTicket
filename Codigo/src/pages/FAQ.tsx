import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, HelpCircle, Lightbulb, Shield, Zap } from "lucide-react";
import { useState } from "react";

const faqCategories = [
  {
    id: "geral",
    title: "Perguntas Gerais",
    icon: HelpCircle,
    color: "bg-blue-100 text-blue-800",
    items: [
      {
        question: "Como abrir um novo ticket de suporte?",
        answer: "Para abrir um novo ticket, clique em 'Novo Ticket' no menu lateral, preencha todos os campos obrigatórios (título, categoria, prioridade e descrição) e clique em 'Abrir Ticket'. Você receberá um protocolo único para acompanhar o andamento."
      },
      {
        question: "Quanto tempo leva para resolver um ticket?",
        answer: "O tempo de resolução varia conforme a prioridade: Crítica (até 2 horas), Alta (até 4 horas), Média (até 8 horas), Baixa (até 24 horas). Tickets complexos podem levar mais tempo, mas você será informado sobre o progresso."
      },
      {
        question: "Como acompanhar o status do meu ticket?",
        answer: "Você pode acompanhar seus tickets na seção 'Meus Tickets' ou no Dashboard principal. Você também receberá notificações por email sobre mudanças de status."
      }
    ]
  },
  {
    id: "hardware",
    title: "Problemas de Hardware",
    icon: Zap,
    color: "bg-orange-100 text-orange-800",
    items: [
      {
        question: "Meu computador não liga, o que fazer?",
        answer: "Primeiro, verifique se o cabo de energia está conectado corretamente tanto no computador quanto na tomada. Teste a tomada com outro equipamento. Se o problema persistir, abra um ticket com prioridade Alta."
      },
      {
        question: "A impressora não está funcionando",
        answer: "Verifique se a impressora está ligada, conectada à rede ou USB, e se há papel e tinta/toner suficientes. Reinicie a impressora e tente imprimir uma página de teste. Se não resolver, abra um ticket."
      },
      {
        question: "Monitor está com imagem distorcida",
        answer: "Verifique os cabos de vídeo, teste com outro cabo se possível. Ajuste a resolução do monitor nas configurações do sistema. Se o problema persistir, pode ser hardware defeituoso - abra um ticket."
      }
    ]
  },
  {
    id: "software",
    title: "Problemas de Software",
    icon: Lightbulb,
    color: "bg-green-100 text-green-800",
    items: [
      {
        question: "O sistema está muito lento",
        answer: "Feche programas desnecessários, reinicie o computador e verifique se há atualizações pendentes. Se o problema persistir em múltiplos usuários, abra um ticket com prioridade Crítica."
      },
      {
        question: "Não consigo acessar um sistema específico",
        answer: "Verifique sua conexão com a internet, tente acessar outros sites/sistemas, limpe o cache do navegador. Se apenas um sistema está inacessível, pode ser um problema do servidor - abra um ticket."
      },
      {
        question: "Perdi um arquivo importante",
        answer: "Verifique a lixeira do sistema e procure em outras pastas onde o arquivo poderia estar. Se você possui backup automático, verifique as versões anteriores. Abra um ticket com prioridade Alta para recuperação de dados."
      }
    ]
  },
  {
    id: "acesso",
    title: "Problemas de Acesso",
    icon: Shield,
    color: "bg-purple-100 text-purple-800",
    items: [
      {
        question: "Esqueci minha senha",
        answer: "Use a opção 'Esqueci minha senha' na tela de login. Se não funcionar, entre em contato com o suporte através de um ticket com prioridade Média informando seu usuário e setor."
      },
      {
        question: "Minha conta foi bloqueada",
        answer: "Contas são bloqueadas automaticamente após 5 tentativas de login incorretas. Aguarde 30 minutos ou abra um ticket com prioridade Alta para desbloqueio imediato."
      },
      {
        question: "Preciso de acesso a um novo sistema",
        answer: "Solicite acesso através de um ticket informando qual sistema precisa acessar, sua função e justificativa. O pedido passará por aprovação do seu gestor e será implementado pela equipe de TI."
      }
    ]
  }
];

export default function FAQ() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
      <div className="text-center mb-6 md:mb-8 px-4">
        <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">Perguntas Frequentes</h1>
        <p className="text-sm md:text-base lg:text-lg text-muted-foreground">
          Encontre respostas rápidas para os problemas mais comuns
        </p>
      </div>

      {/* Search */}
      <Card className="shadow-card">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Pesquisar nas perguntas frequentes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* FAQ Categories */}
      <div className="space-y-6">
        {filteredCategories.map((category) => (
          <Card key={category.id} className="shadow-card">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <category.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl">{category.title}</CardTitle>
                  <CardDescription>
                    {category.items.length} pergunta{category.items.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
                <Badge className={category.color}>
                  {category.items.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Accordion type="single" collapsible className="w-full">
                {category.items.map((item, index) => (
                  <AccordionItem key={index} value={`item-${category.id}-${index}`}>
                    <AccordionTrigger className="text-left hover:text-primary transition-colors">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCategories.length === 0 && searchTerm && (
        <Card className="shadow-card">
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum resultado encontrado</h3>
            <p className="text-muted-foreground mb-6">
              Não encontramos nenhuma pergunta que corresponda à sua pesquisa.
            </p>
            <p className="text-sm text-muted-foreground">
              Não encontrou o que procurava? 
              <span className="text-primary font-medium"> Abra um novo ticket</span> e nossa equipe irá ajudá-lo.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Contact Support */}
      <Card className="shadow-card bg-gradient-card">
        <CardContent className="p-6 text-center">
          <HelpCircle className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Ainda precisa de ajuda?</h3>
          <p className="text-muted-foreground mb-4">
            Se você não encontrou a resposta que procurava, nossa equipe de suporte está pronta para ajudar.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Badge variant="outline" className="px-3 py-1">
              Tempo médio de resposta: 2 horas
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              Suporte 24/7 disponível
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}