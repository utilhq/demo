import { Action, Layout, Page, ctx, io } from "@utilhq/sdk";

// In-memory store
let inventoryItems = new Map<string, { id: string; name: string; description: string }>();
let inventoryRecords = new Map<string, { id: string; inventoryID: string; quantity: number; notes?: string; timeCreated: Date }>();

// Helper functions
const generateID = () => Math.random().toString(36).substr(2, 9);
const getCurrentDate = () => new Date();

export const InventoryPage = new Page({
  name: "Inventory",
  handler: async () => {
    const totals = Array.from(inventoryItems.values()).map(item => {
      const records = Array.from(inventoryRecords.values())
        .filter(record => record.inventoryID === item.id);
      const total = records.reduce((sum, record) => sum + record.quantity, 0);
      return { ...item, total };
    });

    return new Layout({
      title: "Inventory",
      children: [
        io.display.table("Totals", {
          isFilterable: false,
          data: totals,
          rowMenuItems: (row) => [
            {
              label: "History",
              route: "inventory/history",
              params: {
                inventoryID: row.id,
              },
            },
          ],
        }),
      ],
    });
  },
  routes: {
    create: new Action({
      name: "New item",
      handler: async () => {
        const [name, description] = await io.group([
          io.input.text("name"),
          io.input.text("description"),
        ]);
        const id = generateID();
        inventoryItems.set(id, { id, name, description });
      },
    }),
    record: new Action({
      name: "Record",
      handler: async () => {
        const all = Array.from(inventoryItems.values());
        const item = await io.select.single("item", {
          options: all.map((x) => ({
            label: x.name,
            value: x.id,
          })),
        });
        const [quantity, notes] = await io.group([
          io.input.number("quantity"),
          io.input.text("notes").optional(),
        ]);
        const id = generateID();
        inventoryRecords.set(id, {
          id,
          inventoryID: item.value,
          quantity,
          notes,
          timeCreated: getCurrentDate(),
        });
      },
    }),
    history: new Page({
      name: "History",
      unlisted: true,
      handler: async (input) => {
        const inventoryID = ctx.params.inventoryID as string;
        const records = Array.from(inventoryRecords.values())
          .filter(record => record.inventoryID === inventoryID)
          .sort((a, b) => b.timeCreated.getTime() - a.timeCreated.getTime())
          .map(({ quantity, notes, timeCreated }) => ({ quantity, notes, created: timeCreated }));

        return new Layout({
          title: "History",
          children: [
            io.display.table("History", {
              data: records,
            }),
          ],
        });
      },
    }),
  },
});
