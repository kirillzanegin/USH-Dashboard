import { LABELS } from '@/config/labels';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <div className="w-full max-w-sm rounded-lg bg-background p-6 shadow">
        <h1 className="mb-4 text-xl font-semibold text-center">
          {LABELS.pages.overview} — вход
        </h1>
        <form method="POST" action="/api/login" className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium" htmlFor="login">
              Логин
            </label>
            <input
              id="login"
              name="login"
              type="text"
              required
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium" htmlFor="password">
              Пароль
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="mt-2 w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Войти
          </button>
        </form>
        <p className="mt-3 text-xs text-muted-foreground text-center">
          Доступ только для администраторов дашборда.
        </p>
      </div>
    </div>
  );
}

