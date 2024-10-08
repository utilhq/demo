import { Action, Layout, Page, ctx, io } from "@utilhq/sdk";

// In-memory store
let orders = [];
let products = [
  { id: 1, name: "Product A", variants: [{ id: 1, name: "Variant 1" }] },
  { id: 2, name: "Product B", variants: [{ id: 2, name: "Variant 2" }] },
];

export const Order = new Page({
  name: "Order",
  handler: async () => {
    const needPrinting = orders.filter(
      (order) => !order.timePrinted && order.labelURL
    ).length;

    const totals = orders
      .filter((order) => !order.timePrinted && order.labelURL)
      .reduce((acc, order) => {
        order.items.forEach((item) => {
          const key = `${item.productName} - ${item.variantName}`;
          acc[key] = (acc[key] || 0) + item.quantity;
        });
        return acc;
      }, {});

    return new Layout({
      title: "Order",
      menuItems:
        needPrinting > 0
          ? [
              {
                label: `Print ${needPrinting} orders`,
                route: "order/print",
              },
            ]
          : [],
      children: [
        io.display.table("Unprinted Items", {
          isFilterable: false,
          data: Object.entries(totals).map(([product, total]) => ({
            product,
            total,
          })),
        }),
        io.display.table("Orders", {
          getData: async (input) => ({
            data: orders
              .filter((order) =>
                input.queryTerm
                  ? order.shippingAddress.name
                      .toLowerCase()
                      .includes(input.queryTerm.toLowerCase()) ||
                    order.email
                      .toLowerCase()
                      .includes(input.queryTerm.toLowerCase())
                  : true
              )
              .slice(input.offset, input.offset + input.pageSize)
              .map((order) => ({
                id: order.id,
                created: order.timeCreated,
                printed: order.timePrinted,
                tracking: order.trackingURL,
                label: order.labelURL,
                address: order.shippingAddress,
                amount: order.items.reduce(
                  (sum, item) => sum + item.amount * item.quantity,
                  0
                ),
              })),
          }),
          rowMenuItems: (row) =>
            [
              row.label && {
                label: "Label",
                url: row.label,
              },
              row.tracking && {
                label: "Tracking",
                url: row.tracking,
              },
            ].filter(Boolean),
          columns: [
            "id",
            {
              label: "amount",
              renderCell: (row) => ({
                label: `$${(row.amount / 100).toFixed(2)}`,
              }),
            },
            {
              label: "name",
              renderCell: (row) => ({
                label: row.address.name,
              }),
            },
            "created",
            "printed",
          ],
          isSortable: false,
        }),
      ],
    });
  },
  routes: {
    print: new Action({
      name: "Print Orders",
      unlisted: true,
      async handler() {
        await ctx.loading.start({
          label: "Generating labels",
          description: "This may take a few minutes",
        });

        const ordersToPrint = orders.filter(
          (order) => !order.timePrinted && order.labelURL
        );

        // Fake PDF generation and S3 upload
        const labels = [
          { count: 1, label: "https://fake-s3-url.com/labels-1.pdf" },
          { count: 2, label: "https://fake-s3-url.com/labels-2.pdf" },
        ];

        await io.display.metadata("Order", {
          layout: "list",
          data: [
            {
              label: "Orders",
              value: ordersToPrint.length,
            },
            ...labels.map((item) => ({
              label: `${item.count} count`,
              value: item.label,
            })),
          ],
        });

        const result = await io.confirm("Confirm these orders as printed?");
        if (result) {
          orders = orders.map((order) =>
            ordersToPrint.some((o) => o.id === order.id)
              ? { ...order, timePrinted: new Date().toISOString() }
              : order
          );
        }

        await ctx.redirect({
          route: "order",
        });
      },
    }),
    create: new Action({
      name: "Create",
      handler: async () => {
        const results = await io.group(
          products.flatMap((product) => {
            return product.variants.map((variant) =>
              io.input.number(`${product.name} - ${variant.name}`, {
                defaultValue: 0,
              })
            );
          })
        );

        const items = {};
        let total = 0;
        for (const [index, product] of products.entries()) {
          const amount = results[index];
          if (amount === 0) continue;
          total += amount;
          items[product.variants[0].id] = amount;
        }

        if (total === 0) return;

        const [
          email,
          name,
          street1,
          street2,
          city,
          province,
          zip,
          country,
          phone,
        ] = await io.group([
          io.input.text("Email"),
          io.input.text("Name"),
          io.input.text("Street 1"),
          io.input.text("Street 2").optional(),
          io.input.text("City"),
          io.input.text("State / Province"),
          io.input.text("Zip"),
          io.input.text("Country"),
          io.input.text("Phone").optional(),
        ]);

        const newOrder = {
          id: orders.length + 1,
          email,
          items: Object.entries(items).map(([variantId, quantity]) => ({
            productName: products.find((p) =>
              p.variants.some((v) => v.id === parseInt(variantId))
            ).name,
            variantName: products
              .flatMap((p) => p.variants)
              .find((v) => v.id === parseInt(variantId)).name,
            quantity,
            amount: 1000, // Fake amount
          })),
          shippingAddress: {
            name,
            street1,
            street2,
            city,
            province,
            zip,
            country,
            phone,
          },
          timeCreated: new Date().toISOString(),
          timePrinted: null,
          labelURL: "https://fake-label-url.com",
          trackingURL: null,
        };

        orders.push(newOrder);

        await ctx.redirect({
          route: "order",
        });
      },
    }),
  },
});
