import { createRoute } from "../../../../../src/factory"
import { headerMiddleware } from "../../middleware/appendHeader"

export default createRoute(headerMiddleware('root'),headerMiddleware('root2'))