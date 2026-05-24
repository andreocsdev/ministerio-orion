"use client";

import type { Group } from "@/app/_lib/api/fetch-generated";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { DateTimePicker } from "./date-time-picker";

const editEventSchema = z.object({
  name: z.string().min(1, "Informe o nome do evento"),
  date: z.date({ message: "Selecione uma data" }),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido"),
  location: z.string().min(1, "Informe o local"),
  groupId: z.string(),
});

type EditEventValues = z.infer<typeof editEventSchema>;

type ApiResponse<T> = {
  status: number;
  data: T;
};

function getClientApiUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const normalizedPath =
    path.startsWith("/api/") || path === "/api"
      ? path
      : `/api${path.startsWith("/") ? "" : "/"}${path}`;

  return `${baseUrl}${normalizedPath}`;
}

async function clientApiFetch<T>(
  path: string,
  options: RequestInit,
): Promise<ApiResponse<T>> {
  const response = await fetch(getClientApiUrl(path), {
    ...options,
    credentials: "include",
  });

  const data = (await response.json()) as T;
  return { status: response.status, data };
}

type Props = {
  event: {
    id: string;
    name: string;
    date: string;
    location: string;
    grupoId: string | null;
  };
  groups: Group[];
};

export function EventEditAction({ event, groups }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const defaults = useMemo(() => {
    const initialDate = new Date(event.date);
    const initialTime = `${String(initialDate.getHours()).padStart(2, "0")}:${String(initialDate.getMinutes()).padStart(2, "0")}`;

    return {
      name: event.name,
      date: initialDate,
      time: initialTime,
      location: event.location,
      groupId: event.grupoId ?? "",
    } satisfies EditEventValues;
  }, [event.date, event.grupoId, event.location, event.name]);

  const form = useForm<EditEventValues>({
    resolver: zodResolver(editEventSchema),
    defaultValues: defaults,
  });

  async function onSubmit(values: EditEventValues) {
    const [hours, minutes] = values.time.split(":").map(Number);
    const mergedDate = new Date(values.date);
    mergedDate.setHours(hours || 0, minutes || 0, 0, 0);

    setServerError(null);

    let res: ApiResponse<{ id: string }>;
    try {
      res = await clientApiFetch<{ id: string }>(`/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          date: mergedDate.toISOString(),
          location: values.location,
          grupoId: values.groupId || null,
        }),
      });
    } catch {
      setServerError(
        "Falha de conexão com a API. Verifique o backend e tente novamente.",
      );
      return;
    }

    if (res.status !== 200) {
      setServerError("Erro ao atualizar evento.");
      return;
    }

    setOpen(false);
    router.refresh();
  }

  const selectedDate = form.watch("date");
  const selectedTime = form.watch("time");

  return (
    <>
      <Button
        size="icon-sm"
        variant="outline"
        type="button"
        onClick={() => setOpen(true)}
      >
        <Pencil className="size-4" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl">
            <div className="mb-3">
              <h3 className="text-lg font-semibold">Editar evento</h3>
              <p className="text-xs text-muted-foreground">
                Atualize os dados do evento.
              </p>
            </div>

            <form className="space-y-2" onSubmit={form.handleSubmit(onSubmit)}>
              <Input placeholder="Nome" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.name.message}
                </p>
              )}

              <DateTimePicker
                date={selectedDate}
                onDateChange={(value) =>
                  form.setValue("date", value ?? new Date(), {
                    shouldValidate: true,
                  })
                }
                time={selectedTime}
                onTimeChange={(value) =>
                  form.setValue("time", value, { shouldValidate: true })
                }
              />
              {(form.formState.errors.date || form.formState.errors.time) && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.date?.message ??
                    form.formState.errors.time?.message}
                </p>
              )}

              <Input placeholder="Local" {...form.register("location")} />
              {form.formState.errors.location && (
                <p className="text-xs text-red-500">
                  {form.formState.errors.location.message}
                </p>
              )}

              <select
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={form.watch("groupId")}
                onChange={(e) => form.setValue("groupId", e.target.value)}
              >
                <option value="">Sem grupo responsável</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>

              {serverError && (
                <p className="text-xs text-red-500">{serverError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
