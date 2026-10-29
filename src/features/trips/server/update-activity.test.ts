import { updateActivity } from "./trip-service";
import type { GraphQLContext } from "@/lib/graphql/context";

const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const input = {
  title: "Museu",
  day: "2026-12-11",
  startTime: null,
  location: "",
  estimatedCost: 10,
};

describe("updateActivity", () => {
  function context() {
    const rpc = jest.fn();
    return { rpc, ctx: { userId: id, db: { rpc } } as unknown as GraphQLContext };
  }
  it.each([
    ["id inválido", "wrong", input, 1],
    ["versão inválida", id, input, 0],
    ["custo inválido", id, { ...input, estimatedCost: -1 }, 1],
  ])("recusa %s antes de chamar o banco", async (_, activityId, values, version) => {
    const { ctx, rpc } = context();
    await expect(
      updateActivity(ctx, activityId as string, values, version as number),
    ).rejects.toMatchObject({
      extensions: { code: "BAD_USER_INPUT" },
    });
    expect(rpc).not.toHaveBeenCalled();
  });
  it.each([
    ["40001", "CONFLICT"],
    ["42501", "FORBIDDEN"],
    ["P0002", "NOT_FOUND"],
    ["23514", "BAD_USER_INPUT"],
    ["XX000", "OPERATION_FAILED"],
  ])("traduz o erro %s sem expor detalhes SQL", async (code, expected) => {
    const { ctx, rpc } = context();
    rpc.mockResolvedValue({ data: null, error: { code, message: "private database detail" } });
    const error = await updateActivity(ctx, id, input, 2).catch((e: unknown) => e);
    expect(error).toMatchObject({ extensions: { code: expected } });
    expect((error as Error).message).not.toContain("private");
    expect(rpc).toHaveBeenCalledWith("update_activity", {
      target_activity: id,
      expected_version: 2,
      new_title: "Museu",
      new_day: input.day,
      new_start_time: null,
      new_location: "",
      new_estimated_cost: 10,
    });
  });
});
