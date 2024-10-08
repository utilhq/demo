import { Layout, Page, io } from "@utilhq/sdk";

export const User = new Page({
  name: "User",
  handler: async (c) => {
    return new Layout({
      title: "User",
      children: [
        io.display.table("", {
          getData: async (input) => {
            return {
              data: [
                {
                  id: "user-1",
                  name: "first user",
                  email: "ye+001@utilhq.com",
                  fingerprint: "fingerprint-1",
                  stripeCustomerID: "stripe-cus-id-1",
                },
              ],
            };
          },
          isSortable: false,
          isFilterable: false,
        }),
      ],
    });
  },
});
