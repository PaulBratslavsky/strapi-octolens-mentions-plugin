"use strict";

import adminApiRoutes from "./admin-api";
import contentApiRoutes from "./content-api";


export default {
  "admin-api": {
    type: "admin",
    routes: [...adminApiRoutes],
  },
  "content-api": {
    type: "content-api",
    routes: [...contentApiRoutes],
  },
};