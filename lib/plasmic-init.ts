import { initPlasmicLoader } from "@plasmicapp/loader-nextjs";

export const PLASMIC = initPlasmicLoader({
  projects: [
    {
      id: process.env.PLASMIC_ID!,
      token: process.env.PLASMIC_TOKEN!,
    },
  ],

  // By default Plasmic will use the last published version of your project.
  // For development, you can set preview: true to always use the latest
  // version, including unpublished changes.
  preview: process.env.NODE_ENV !== "production",
});
