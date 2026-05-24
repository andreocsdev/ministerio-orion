"use client";

import type { AvailableUser, Group } from "@/app/_lib/api/fetch-generated";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pencil, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const createGroupSchema = z.object({
  name: z.string().min(1, "Informe o nome do grupo"),
  userIds: z.array(z.string()),
});

const editGroupSchema = z.object({
  userIds: z.array(z.string()).min(1, "Selecione ao menos um usuário"),
});

type CreateGroupValues = z.infer<typeof createGroupSchema>;
type EditGroupValues = z.infer<typeof editGroupSchema>;

type ApiResponse<T> = {
  status: number;
  data: T;
};

function getUserInitials(name: string) {
  const [first = "", second = ""] = name.trim().split(/\s+/);
  return `${first[0] ?? ""}${second[0] ?? ""}`.toUpperCase() || "?";
}

type UserSelectItemProps = {
  user: AvailableUser;
  checked: boolean;
  onToggle: () => void;
};

function UserSelectItem({ user, checked, onToggle }: UserSelectItemProps) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-2 py-2 text-sm transition-colors ${
        checked
          ? "border-green-400 bg-green-50"
          : "border-slate-200 bg-white hover:bg-slate-50"
      }`}
    >
      <input
        checked={checked}
        className="sr-only"
        onChange={onToggle}
        type="checkbox"
      />

      {user.image ? (
        <img
          alt={`Avatar de ${user.name}`}
          className="size-8 shrink-0 rounded-full border border-slate-200 object-cover"
          referrerPolicy="no-referrer"
          src={user.image}
        />
      ) : (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
          {getUserInitials(user.name)}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-900">{user.name}</p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>
    </label>
  );
}

function getClientApiUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const normalizedPath =
    path === "/create-group"
      ? "/api/groups"
      : path.startsWith("/api/") || path === "/api"
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
  groups: Group[];
  availableUsers: AvailableUser[];
};

export function AdminManagementPanel({ groups, availableUsers }: Props) {
  const router = useRouter();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editGroupId, setEditGroupId] = useState<string>("");
  const [createServerError, setCreateServerError] = useState<string | null>(
    null,
  );
  const [editServerError, setEditServerError] = useState<string | null>(null);

  const createForm = useForm<CreateGroupValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      userIds: [],
    },
  });

  const editForm = useForm<EditGroupValues>({
    resolver: zodResolver(editGroupSchema),
    defaultValues: {
      userIds: [],
    },
  });

  const createSelectedIds = createForm.watch("userIds");
  const editSelectedIds = editForm.watch("userIds");

  const createSelectedCount = useMemo(() => {
    if (createSelectedIds.length === 0) return "Nenhum usuário selecionado";
    if (createSelectedIds.length === 1) return "1 usuário selecionado";
    return `${createSelectedIds.length} usuários selecionados`;
  }, [createSelectedIds.length]);

  const currentEditGroup = useMemo(
    () => groups.find((group) => group.id === editGroupId),
    [editGroupId, groups],
  );

  const currentEditGroupUserIds = useMemo(
    () => new Set((currentEditGroup?.users ?? []).map((user) => user.id)),
    [currentEditGroup],
  );

  const editUsersSorted = useMemo(() => {
    return [...availableUsers].sort((a, b) => {
      const aInGroup = currentEditGroupUserIds.has(a.id);
      const bInGroup = currentEditGroupUserIds.has(b.id);

      if (aInGroup === bInGroup) {
        return a.name.localeCompare(b.name, "pt-BR");
      }

      return aInGroup ? -1 : 1;
    });
  }, [availableUsers, currentEditGroupUserIds]);

  function toggleArrayValue(current: string[], value: string) {
    return current.includes(value)
      ? current.filter((id) => id !== value)
      : [...current, value];
  }

  function openEditDialog(groupId: string) {
    setEditGroupId(groupId);
    setEditServerError(null);
    editForm.reset({ userIds: [] });
    setEditOpen(true);
  }

  async function onCreateGroup(values: CreateGroupValues) {
    setCreateServerError(null);

    let groupRes: ApiResponse<{ id: string }>;
    try {
      groupRes = await clientApiFetch<{ id: string }>("/create-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: values.name }),
      });
    } catch {
      setCreateServerError(
        "Falha de conexão com a API. Verifique o backend e tente novamente.",
      );
      return;
    }

    if (groupRes.status !== 201) {
      setCreateServerError("Erro ao criar grupo.");
      return;
    }

    if (values.userIds.length > 0) {
      let assignRes: ApiResponse<{ id: string }>;
      try {
        assignRes = await clientApiFetch<{ id: string }>(
          "/groups/add-users-to-group",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              groupId: groupRes.data.id,
              userIds: values.userIds,
            }),
          },
        );
      } catch {
        setCreateServerError(
          "Falha de conexão com a API. Verifique o backend e tente novamente.",
        );
        return;
      }

      if (assignRes.status !== 200) {
        setCreateServerError(
          "Grupo criado, mas não foi possível adicionar usuários.",
        );
        return;
      }
    }

    createForm.reset({ name: "", userIds: [] });
    setCreateOpen(false);
    router.refresh();
  }

  async function onEditGroup(values: EditGroupValues) {
    if (!editGroupId) {
      setEditServerError("Grupo inválido.");
      return;
    }

    setEditServerError(null);

    let assignRes: ApiResponse<{ id: string }>;
    try {
      assignRes = await clientApiFetch<{ id: string }>(
        "/groups/add-users-to-group",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            groupId: editGroupId,
            userIds: values.userIds,
          }),
        },
      );
    } catch {
      setEditServerError(
        "Falha de conexão com a API. Verifique o backend e tente novamente.",
      );
      return;
    }

    if (assignRes.status !== 200) {
      setEditServerError("Erro ao atualizar grupo.");
      return;
    }

    editForm.reset({ userIds: [] });
    setEditOpen(false);
    router.refresh();
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Gestão de Grupos</h2>
        <Button
          className="bg-indigo-600 text-white hover:bg-indigo-700"
          onClick={() => {
            setCreateServerError(null);
            setCreateOpen(true);
          }}
          type="button"
        >
          <Plus className="size-4" />
          Criar novo grupo
        </Button>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-4 text-sm text-muted-foreground">
            Nenhum grupo cadastrado.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {groups.map((group) => (
            <Card key={group.id} className="border-slate-200 bg-slate-50">
              <CardContent className="space-y-3 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{group.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {group.users.length} participante(s)
                    </p>
                  </div>

                  <Button
                    size="icon-sm"
                    type="button"
                    variant="outline"
                    onClick={() => openEditDialog(group.id)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                </div>

                <div className="rounded-lg border bg-white p-2">
                  <p className="mb-1 text-xs text-muted-foreground">
                    Participantes
                  </p>
                  {group.users.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Sem participantes.
                    </p>
                  ) : (
                    <p className="text-sm text-slate-700">
                      {group.users.map((user) => user.name).join(", ")}
                    </p>
                  )}
                </div>

                <div className="rounded-lg border bg-white p-2">
                  <p className="mb-1 text-xs text-muted-foreground">
                    Eventos relacionados
                  </p>
                  {group.eventos.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhum evento relacionado.
                    </p>
                  ) : (
                    <p className="text-sm text-slate-700">
                      {group.eventos.map((event) => event.name).join(", ")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl">
            <div className="mb-3">
              <h3 className="text-lg font-semibold">Criar grupo</h3>
              <p className="text-xs text-muted-foreground">
                Defina o nome e adicione participantes.
              </p>
            </div>

            <form
              className="space-y-2"
              onSubmit={createForm.handleSubmit(onCreateGroup)}
            >
              <Input
                placeholder="Nome do grupo"
                {...createForm.register("name")}
              />
              {createForm.formState.errors.name && (
                <p className="text-xs text-red-500">
                  {createForm.formState.errors.name.message}
                </p>
              )}

              <div className="rounded-md border bg-white p-2">
                <p className="mb-2 text-xs text-muted-foreground">
                  Usuários disponíveis
                </p>
                {availableUsers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Não há usuários disponíveis no momento.
                  </p>
                ) : (
                  <div className="max-h-40 space-y-1 overflow-y-auto">
                    {availableUsers.map((user) => (
                      <UserSelectItem
                        key={user.id}
                        checked={createSelectedIds.includes(user.id)}
                        onToggle={() =>
                          createForm.setValue(
                            "userIds",
                            toggleArrayValue(createSelectedIds, user.id),
                            { shouldValidate: true },
                          )
                        }
                        user={user}
                      />
                    ))}
                  </div>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  {createSelectedCount}
                </p>
              </div>

              {createServerError && (
                <p className="text-xs text-red-500">{createServerError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createForm.formState.isSubmitting}
                >
                  {createForm.formState.isSubmitting ? "Criando..." : "Criar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl">
            <div className="mb-3">
              <h3 className="text-lg font-semibold">Editar grupo</h3>
              <p className="text-xs text-muted-foreground">
                Adicione novos participantes ao grupo.
              </p>
              <p className="text-xs text-green-700">
                Usuarios que ja estao neste grupo aparecem primeiro na lista.
              </p>
            </div>

            <form
              className="space-y-2"
              onSubmit={editForm.handleSubmit(onEditGroup)}
            >
              <div className="rounded-md border bg-white p-2">
                <p className="mb-2 text-xs text-muted-foreground">
                  Usuários disponíveis
                </p>
                {availableUsers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Não há usuários disponíveis no momento.
                  </p>
                ) : (
                  <div className="max-h-40 space-y-1 overflow-y-auto">
                    {editUsersSorted.map((user) => (
                      <UserSelectItem
                        key={user.id}
                        checked={editSelectedIds.includes(user.id)}
                        onToggle={() =>
                          editForm.setValue(
                            "userIds",
                            toggleArrayValue(editSelectedIds, user.id),
                            { shouldValidate: true },
                          )
                        }
                        user={user}
                      />
                    ))}
                  </div>
                )}
              </div>

              {(editForm.formState.errors.userIds || editServerError) && (
                <p className="text-xs text-red-500">
                  {editForm.formState.errors.userIds?.message ??
                    editServerError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={editForm.formState.isSubmitting}
                >
                  {editForm.formState.isSubmitting ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
