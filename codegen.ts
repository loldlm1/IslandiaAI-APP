import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: process.env.GRAPHQL_SCHEMA_PATH ?? "graphql/schema.graphql",
  documents: "src/graphql/**/*.{ts,tsx,graphql}",
  ignoreNoDocuments: true,
  generates: {
    "src/graphql/generated/": {
      preset: "client",
      presetConfig: {
        fragmentMasking: true,
      },
    },
  },
};

export default config;
