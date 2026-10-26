import { Button } from "@/components/ui/button";

export function LoadingState({ label = "Carregando..." }: { label?: string }) {
  return (
    <p role="status" className="rounded-xl border bg-card p-8 text-muted-foreground">
      {label}
    </p>
  );
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div role="alert" className="space-y-3 rounded-xl border border-destructive/30 bg-card p-5">
      <p>{message}</p>
      {retry && (
        <Button variant="outline" onClick={retry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
