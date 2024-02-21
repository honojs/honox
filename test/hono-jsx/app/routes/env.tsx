import { createRoute } from "../../../../src/factory";

export default createRoute((c) => {
  return c.json({ env: c.env })
});