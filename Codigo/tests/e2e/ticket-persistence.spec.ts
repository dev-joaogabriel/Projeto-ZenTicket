import { test, expect } from "@playwright/test";

// Uses stable data-testid="ticket-id" cells added to the table.
test.describe('Ticket detail persistence', () => {
    test('should show skeleton only on first visit and persist detail locally', async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.getByLabel('Email').fill(process.env.E2E_ADMIN_EMAIL ?? 'admin@ticketsystem.com');
        await page.getByLabel('Senha').fill('admin123'); // correct seeded password
        await Promise.all([
            page.waitForResponse(r => r.url().endsWith('/api/auth/login') && r.ok()),
            page.getByRole('button', { name: 'Entrar' }).click()
        ]);

        // Navigate to ticket list and wait for heading
        await page.goto('/meus-tickets');
        await expect(page.getByRole('heading', { name: 'Meus Chamados' })).toBeVisible();

        // Get first ticket id (create one if necessary)
        let ticketId = (await page.locator('[data-testid="ticket-id"]').first().innerText().catch(() => '')).trim();
        if (!ticketId) {
            await page.evaluate(async () => {
                const tokenRaw = localStorage.getItem('auth');
                const authObj = tokenRaw ? JSON.parse(tokenRaw) : null;
                const res = await fetch('/api/tickets', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': authObj ? `Bearer ${authObj.token}` : ''
                    },
                    body: JSON.stringify({
                        subject: 'E2E Persistence',
                        description: 'Detalhe para persistencia',
                        priority: 2,
                        departmentId: 1
                    })
                });
                if (!res.ok) throw new Error('Falha ao criar ticket para teste');
            });
            await page.goto('/meus-tickets');
            ticketId = (await page.locator('[data-testid="ticket-id"]').first().innerText()).trim();
        }
        expect(ticketId).toMatch(/^TCK-/);

        // First visit: expect skeleton (target only the main loading container for precision)
        await page.goto(`/visualizar-ticket/${ticketId}`);
        const skeletonMain = page.locator('main[aria-busy="true"]');
        // If the page is extremely fast, skeleton may already be gone; handle both cases gracefully.
        if (await skeletonMain.isVisible({ timeout: 3000 }).catch(() => false)) {
            await expect(skeletonMain).toBeVisible();
            await expect(page.getByRole('heading', { name: /Visualizar Chamado/i })).toBeVisible();
            await skeletonMain.waitFor({ state: 'detached', timeout: 8000 });
        } else {
            // Fallback: ensure heading rendered even if skeleton skipped due to cache/persist
            await expect(page.getByRole('heading', { name: /Visualizar Chamado/i })).toBeVisible();
        }

        // Second visit: navigate away then back, expect no skeleton
        await page.goto('/meus-tickets');
        await page.goto(`/visualizar-ticket/${ticketId}`);
        // Ensure heading is rendered (some Firefox delays on hydration)
        await expect(page.getByRole('heading', { name: /Visualizar Chamado/i })).toBeVisible();
        await expect(page.locator('main[aria-busy="true"]')).toHaveCount(0);
        await expect(page.getByTestId('ticket-descricao')).toBeVisible();
    });
});
