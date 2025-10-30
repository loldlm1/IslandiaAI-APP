import type { GraphQLService } from "../core";

export type ViewerServiceInput = void;

export interface ViewerServiceUser {
  id: string;
  email: string;
  name: string;
}

export interface ViewerServiceData {
  viewer?: ViewerServiceUser | null;
}

export const VIEWER_QUERY = /* GraphQL */ `
  query Viewer {
    viewer {
      id
      email
      name
    }
  }
`;

export const viewerService: GraphQLService<ViewerServiceInput, undefined> = {
  operationName: "Viewer",
  document: VIEWER_QUERY,
};
