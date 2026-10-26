import type { Preview } from "@storybook/nextjs-vite";
import { Inter } from "next/font/google";

import "../src/app/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const preview: Preview = {
  decorators: [
    (Story) => (
      <div
        className={`${inter.variable} ${inter.className} antialiased`}
      >
        <Story />
      </div>
    ),
  ],

  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
