import { Action, Page, io, ctx, Layout } from "@utilhq/sdk";
// import { eq } from "@terminal/core/drizzle/index";
// import { useTransaction } from "@terminal/core/drizzle/transaction";
// import { inventoryTable } from "@terminal/core/inventory/inventory.sql";
// import { Product } from "@terminal/core/product/index";
// import { productVariantInventoryTable } from "@terminal/core/product/product.sql";

// Mock in-memory store
let productStore: Product[] = [
  {
    id: "1",
    name: "T-Shirt",
    description: "Comfortable cotton t-shirt",
    order: 0,
    variants: [],
  },
  {
    id: "2",
    name: "Jeans",
    description: "Classic denim jeans",
    order: 1,
    variants: [],
  },
  {
    id: "3",
    name: "Sneakers",
    description: "Sporty sneakers for everyday wear",
    order: 2,
    variants: [],
  },
];

let variantStore: Variant[] = [
  {
    id: "1",
    productId: "1",
    name: "Small White",
    price: 1999,
  },
  {
    id: "2",
    productId: "1",
    name: "Medium Black",
    price: 1999,
  },
  {
    id: "3",
    productId: "2",
    name: "32x32 Blue",
    price: 4999,
  },
  {
    id: "4",
    productId: "3",
    name: "Size 9 Red",
    price: 7999,
  },
];

let nextProductId = 4;
let nextVariantId = 5;

interface Product {
  id: string;
  name: string;
  description: string;
  order: number;
  variants: Variant[];
}

interface Variant {
  id: string;
  productId: string;
  name: string;
  price: number;
}

// Mock Product functions
const Product = {
  async list(): Promise<Product[]> {
    return productStore;
  },

  async fromID(id: string): Promise<Product | undefined> {
    const product = productStore.find((p) => p.id === id);
    if (product) {
      product.variants = getVariantsForProduct(product.id);
    }
    return product;
  },

  async create({
    name,
    description,
  }: {
    name: string;
    description: string;
  }): Promise<string> {
    const id = String(nextProductId++);
    const newProduct: Product = {
      id,
      name,
      description,
      order: productStore.length,
      variants: [],
    };
    productStore.push(newProduct);
    return id;
  },

  async edit({
    id,
    name,
    description,
    order,
  }: {
    id: string;
    name: string;
    description: string;
    order: number;
  }): Promise<void> {
    const index = productStore.findIndex((p) => p.id === id);
    if (index !== -1) {
      productStore[index] = {
        ...productStore[index],
        name,
        description,
        order,
        variants: productStore[index].variants,
      };
    }
  },

  async addVariant({
    productID,
    name,
    price,
  }: {
    productID: string;
    name: string;
    price: number;
  }): Promise<void> {
    const id = String(nextVariantId++);
    variantStore.push({ id, productId: productID, name, price });
  },

  async editVariant({
    id,
    name,
    price,
  }: {
    id: string;
    name: string;
    price: number;
  }): Promise<void> {
    const index = variantStore.findIndex((v) => v.id === id);
    if (index !== -1) {
      variantStore[index] = {
        ...variantStore[index],
        name,
        price,
        id: variantStore[index].id, // Ensure id is kept
        productId: variantStore[index].productId, // Ensure productId is kept
      };
    }
  },
};

// Helper function to get variants for a product
function getVariantsForProduct(productId: string): Variant[] {
  return variantStore.filter((v) => v.productId === productId);
}

async function selectProduct() {
  let { productID } = ctx.params;
  const products = await Product.list();
  if (!productID) {
    const selected = await io.select.single("select product", {
      options: products.map((p) => ({
        label: p.name,
        value: p.id,
      })),
    });
    productID = selected.value;
  }
  return products.find((p) => p.id === productID)!;
}

async function selectVariant() {
  const product = await selectProduct();
  let { variantID } = ctx.params;
  if (!variantID) {
    const selected = await io.select.single("select variant", {
      options: product.variants.map((p) => ({
        label: p.name,
        value: p.id,
      })),
    });
    variantID = selected.value;
  }
  return {
    product,
    variant: product.variants.find((p) => p.id === variantID)!,
  };
}

export default new Page({
  name: "Product",
  handler: async (input) => {
    const products = await Product.list();
    return new Layout({
      title: "Products",
      menuItems: [
        {
          label: "Create product",
          route: "product/create",
        },
      ],
      children: [
        io.display.table("", {
          data: products.map((p) => ({
            name: p.name,
            description: p.description,
            id: p.id,
            variants: p.variants,
          })),
          columns: [
            {
              label: "name",
              renderCell: (row) => ({
                label: row.name,
                route: "product/detail",
                params: {
                  productID: row.id,
                },
              }),
            },
            "id",
            {
              label: "variants",
              renderCell: (row) => ({
                label: row.variants.length + " variants",
              }),
            },
          ],
          isFilterable: false,
        }),
      ],
    });
  },
  routes: {
    detail: new Page({
      name: "Product Detail",
      unlisted: true,
      async handler() {
        const product = await Product.fromID(ctx.params.productID as string);
        if (!product) throw new Error(`Product not found`);
        return new Layout({
          title: product.name,
          menuItems: [
            {
              label: "Edit",
              route: "product/edit",
              params: {
                productID: product.id,
              },
            },
          ],
          children: [
            io.display.metadata("", {
              layout: "grid",
              data: [
                {
                  label: "Name",
                  value: product.name,
                },
                {
                  label: "Description",
                  value: product.description,
                },
              ],
            }),
            io.display.link("Add Variant", {
              route: "product/variant/create",
              params: {
                productID: product.id,
              },
            }),
            io.display.table("", {
              data: product.variants.map((item) => ({
                name: item.name,
                price: item.price,
                id: item.id,
              })),
              columns: [
                {
                  label: "name",
                  renderCell: (row) => ({
                    label: row.name,
                    route: "product/variant/edit",
                    params: {
                      productID: product.id,
                      variantID: row.id,
                    },
                  }),
                },
                {
                  label: "price",
                  renderCell: (row) => ({
                    label: "$" + row.price / 100,
                  }),
                },
                "id",
              ],
              isFilterable: false,
            }),
          ],
        });
      },
    }),
    edit: new Action({
      name: "Edit product",
      unlisted: true,
      async handler() {
        const product = await selectProduct();
        const [name, description, order] = await io.group([
          io.input.text("name", {
            defaultValue: product.name,
          }),
          io.input.text("description", {
            defaultValue: product.description,
            multiline: true,
          }),
          io.input.number("order", {
            defaultValue: product.order,
          }),
        ]);
        await Product.edit({
          id: product.id,
          name,
          description,
          order,
        });
        await ctx.redirect({
          route: "product/detail",
          params: { productID: product.id },
        });
      },
    }),
    create: new Action({
      name: "Create product",
      unlisted: true,
      async handler() {
        const [name, description] = await io.group([
          io.input.text("name"),
          io.input.text("description", {
            multiline: true,
          }),
        ]);
        const productID = await Product.create({
          name,
          description,
        });
        ctx.redirect({
          route: "product/detail",
          params: {
            productID: productID,
          },
        });
      },
    }),
    variant: new Page({
      name: "Variant",
      unlisted: true,
      routes: {
        edit: new Action({
          name: "Edit Variant",
          handler: async () => {
            const { product, variant } = await selectVariant();
            // const allInventory = await useTransaction((tx) =>
            //   tx.select().from(inventoryTable),
            // );
            // const existingInventory = await useTransaction((tx) =>
            //   tx
            //     .select()
            //     .from(productVariantInventoryTable)
            //     .where(
            //       eq(productVariantInventoryTable.productVariantID, variant.id),
            //     ),
            // );
            // const [name, price, productIDs] = await io.group([
            const [name, price] = await io.group([
              io.input.text("name", {
                defaultValue: variant.name,
              }),
              io.input.number("price", {
                defaultValue: variant.price / 100,
                currency: "USD",
              }),
              // io.select.multiple("inventory", {
              //   options: allInventory.map((item) => ({
              //     label: item.name,
              //     value: item.id,
              //   })),
              //   defaultValue: existingInventory.map((item) => ({
              //     label: item.inventoryID,
              //     value: item.inventoryID,
              //   })),
              // }),
            ]);
            ctx.log("edit variant", { name, price });
            await Product.editVariant({
              id: variant.id,
              name,
              price: price * 100,
              // inventoryIDs: productIDs.map((item) => item.value),
            });
            ctx.redirect({
              route: "product/detail",
              params: {
                productID: product.id,
              },
            });
          },
        }),
        create: new Action({
          name: "Create Variant",
          handler: async () => {
            const product = await selectProduct();
            const [name, price] = await io.group([
              io.input.text("name", {
                minLength: 1,
              }),
              io.input.number("price", {
                currency: "USD",
              }),
            ]);
            await Product.addVariant({
              productID: product.id,
              name,
              price: price * 100,
            });
            ctx.redirect({
              route: "product/detail",
              params: {
                productID: product.id,
              },
            });
          },
        }),
      },
    }),
  },
});
