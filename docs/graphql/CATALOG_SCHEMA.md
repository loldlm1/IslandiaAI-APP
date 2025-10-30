# GraphQL Schema Catalog

This reference summarizes the current GraphQL surface captured in [`frontend/docs/graphql/schema.graphql`](../docs/graphql/schema.graphql).

> **Maintenance tip:** Refresh this catalog whenever `frontend/docs/graphql/schema.graphql` changes so the quick reference stays in sync with the schema snapshot.

## Queries

| Field | Arguments | Description |
| --- | --- | --- |
| `customer` | `id: ID!` | Find a customer by their globally unique ID. |
| `customers` | Relay pagination: `after`, `before`, `first`, `last` | List all customers managed by the platform. |
| `invoice` | `id: ID!` | Find an invoice by its globally unique ID. |
| `invoiceLineItem` | `id: ID!` | Find an invoice line item by its globally unique ID. |
| `invoiceLineItems` | Relay pagination: `after`, `before`, `first`, `last` | List all invoice line items across invoices. |
| `invoices` | Relay pagination plus filters: `status`, `supplierId`, `customerId`, `createdFrom`, `createdTo` | List all invoices generated in the system. |
| `magicInvoiceSubmission` | `id: ID!` | Find a magic invoice submission by its globally unique ID. |
| `magicInvoiceSubmissions` | Relay pagination: `after`, `before`, `first`, `last` | List all magic invoice submissions. |
| `node` | `id: ID!` | Fetches an object given its ID. |
| `nodes` | `ids: [ID!]!` | Fetches a list of objects given a list of IDs. |
| `order` | `id: ID!` | Find an order by its globally unique ID. |
| `orders` | Relay pagination plus filters: `status`, `supplierId`, `customerId`, `orderedFrom`, `orderedTo` | List all orders created in the system. |
| `product` | `id: ID!` | Find a product by its globally unique ID. |
| `productRequest` | `id: ID!` | Find a product request by its globally unique ID. |
| `productRequests` | Relay pagination: `after`, `before`, `first`, `last` | List all product requests. |
| `products` | Relay pagination with optional `supplierId` filter | List products across all suppliers. |
| `supplier` | `id: ID!` | Find a supplier by their globally unique ID. |
| `suppliers` | Relay pagination: `after`, `before`, `first`, `last` | List all suppliers managed within the platform. |
| `user` | `id: ID!` | Find a user by their globally unique ID. |
| `users` | Relay pagination: `after`, `before`, `first`, `last` | List all users in the system. |
| `viewer` | — | The currently authenticated user. |

## Mutations

| Field | Arguments | Description |
| --- | --- | --- |
| `createCustomer` | `input: CreateCustomerInput!` | Create a customer owned by the current user. |
| `createInvoice` | `input: CreateInvoiceInput!` | Create a manual invoice owned by the current user. |
| `createOrder` | `input: CreateOrderInput!` | Create an order scoped to the authenticated user. |
| `createProduct` | `input: CreateProductInput!` | Create a product owned by the current user. |
| `createProductRequest` | `input: CreateProductRequestInput!` | Create a product request on an order owned by the current user. |
| `createSupplier` | `input: CreateSupplierInput!` | Create a supplier owned by the current user. |
| `deleteCustomer` | `input: DeleteCustomerInput!` | Delete a customer owned by the current user. |
| `deleteOrder` | `input: DeleteOrderInput!` | Delete an order owned by the current user. |
| `deleteProduct` | `input: DeleteProductInput!` | Delete a product owned by the current user. |
| `deleteProductRequest` | `input: DeleteProductRequestInput!` | Delete a product request on an order owned by the current user. |
| `deleteSupplier` | `input: DeleteSupplierInput!` | Delete a supplier owned by the current user. |
| `signIn` | `input: SignInInput!` | Authenticate a user with email and password credentials. |
| `signOut` | `input: SignOutInput!` | Destroy the session for the current user. |
| `signUp` | `input: SignUpInput!` | Register a new user and start a signed-in session. |
| `submitMagicInvoice` | `input: SubmitMagicInvoiceInput!` | Submit documents to the magic invoice ingestion pipeline. |
| `updateCustomer` | `input: UpdateCustomerInput!` | Update a customer owned by the current user. |
| `updateInvoiceStatus` | `input: UpdateInvoiceStatusInput!` | Update the status of an invoice owned by the current user. |
| `updateOrder` | `input: UpdateOrderInput!` | Update attributes on an order owned by the current user. |
| `updateOrderStatus` | `input: UpdateOrderStatusInput!` | Update the status of an existing order owned by the current user. |
| `updateProduct` | `input: UpdateProductInput!` | Update a product owned by the current user. |
| `updateProductRequest` | `input: UpdateProductRequestInput!` | Update a product request on an order owned by the current user. |
| `updateSupplier` | `input: UpdateSupplierInput!` | Update a supplier owned by the current user. |

## Error handling

GraphQL operations surface problems either through a top-level `errors` array or via mutation-level `userErrors`. Keep the copy in [`config/locales/en.yml`](../../../config/locales/en.yml) and [`config/locales/es.yml`](../../../config/locales/es.yml) synchronized with the helpers noted below so user-facing messaging stays aligned across languages.

### Top-level `errors`

[`app/graphql/graphql_policy_helper.rb`](../../../app/graphql/graphql_policy_helper.rb) raises `GraphQL::ExecutionError` instances whenever authentication or authorization guardrails fail, or when a requested record cannot be located. Those exceptions halt query execution and populate the response `errors` array with translated messages.

| Scenario | Helper | Translation key | English copy | Spanish copy |
| --- | --- | --- | --- | --- |
| Viewer is not signed in | `GraphqlPolicyHelper::AuthenticationError` | `graphql.errors.authentication_required` | You must be signed in to perform this action. | Debes iniciar sesión para realizar esta acción. |
| Viewer lacks permission | `GraphqlPolicyHelper::AuthorizationError` | `graphql.errors.forbidden` | You are not authorized to access this %{resource}. | No tienes autorización para acceder a este %{resource}. |
| Global ID resolves to nothing | `GraphqlPolicyHelper#load_owned_object` | `graphql.errors.not_found` | %{resource} could not be found. | No se pudo encontrar %{resource}. |

Example query rejection (`viewer` field) showing the `graphql.errors.authentication_required` message:

```json
{
  "data": {
    "viewer": null
  },
  "errors": [
    {
      "message": "You must be signed in to perform this action.",
      "path": ["viewer"]
    }
  ]
}
```

Switch the locale to `es` to receive the Spanish variant (`Debes iniciar sesión para realizar esta acción.`) from the same translation key.

### Mutation-level `userErrors`

Mutations use [`Types::UserErrorType`](../../../app/graphql/types/user_error_type.rb) as a shared envelope for validation and authorization feedback. [`Mutations::BaseMutation`](../../../app/graphql/mutations/base_mutation.rb) normalizes ActiveModel errors (`#user_errors_from`) and exposes helper builders that lean on the same translation keys consumed by the policy helper.

| Scenario | Source | Translation key | English copy | Spanish copy |
| --- | --- | --- | --- | --- |
| Input fails model validations | `Mutations::BaseMutation#user_errors_from` | ActiveModel error messages | Surfaces the model's `full_message` output. | Surfacing depends on the model translations configured in Rails. |
| Mutation requires login | `Mutations::BaseMutation#unauthorized_error` | `graphql.errors.authentication_required` | You must be signed in to perform this action. | Debes iniciar sesión para realizar esta acción. |
| Session missing on sign out | [`Mutations::SignOut`](../../../app/graphql/mutations/sign_out.rb)#not_signed_in_message | `graphql.errors.not_signed_in` | You are not signed in. | No has iniciado sesión. |
| Invalid sign-in credentials | [`Mutations::SignIn`](../../../app/graphql/mutations/sign_in.rb)#invalid_credentials_error | `graphql.errors.invalid_credentials` | Invalid email or password. | Correo electrónico o contraseña inválidos. |
| Destroy fails in delete mutations | [`Mutations::DeleteCustomer`](../../../app/graphql/mutations/delete_customer.rb), [`DeleteOrder`](../../../app/graphql/mutations/delete_order.rb), [`DeleteProduct`](../../../app/graphql/mutations/delete_product.rb), [`DeleteProductRequest`](../../../app/graphql/mutations/delete_product_request.rb), [`DeleteSupplier`](../../../app/graphql/mutations/delete_supplier.rb) | `graphql.errors.customer_delete_failed`<br>`graphql.errors.order_delete_failed`<br>`graphql.errors.product_delete_failed`<br>`graphql.errors.product_request_delete_failed`<br>`graphql.errors.supplier_delete_failed` | Customer could not be deleted.<br>Order could not be deleted.<br>Product could not be deleted.<br>Product request could not be deleted.<br>Supplier could not be deleted. | No se pudo eliminar el cliente.<br>No se pudo eliminar el pedido.<br>No se pudo eliminar el producto.<br>No se pudo eliminar la solicitud de producto.<br>No se pudo eliminar el proveedor. |

These translations now pull directly from `config/locales/en.yml` and `config/locales/es.yml`, ensuring the deletion failure messages stay aligned across both languages.
| Decimal input cannot be coerced | [`Types::Scalars::Decimal`](../../../app/graphql/types/scalars/decimal.rb)#invalid_message | `graphql.errors.invalid_decimal` | Value "%{value}" is not a valid decimal. | El valor "%{value}" no es un decimal válido. |

Typical mutation response (failed `signIn` mutation using `graphql.errors.invalid_credentials`):

```json
{
  "data": {
    "signIn": {
      "user": null,
      "userErrors": [
        {
          "path": [],
          "message": "Invalid email or password."
        }
      ]
    }
  }
}
```

Update the locale to `es` to localize the same entry to `Correo electrónico o contraseña inválidos.`

## Subscriptions

_No subscription fields are defined in the current schema._

## Scalars

| Name | Description |
| --- | --- |
| `BigInt` | Represents non-fractional signed whole numeric values. Since the value may exceed the size of a 32-bit integer, it's encoded as a string. |
| `Decimal` | Decimal value that accepts numeric or string inputs. |
| `ISO8601Date` | An ISO 8601-encoded date. |
| `ISO8601DateTime` | An ISO 8601-encoded datetime. |
| `JSON` | Represents untyped JSON. |
| `Upload` | Represents a file upload following the GraphQL multipart request specification. |

## Interfaces

| Name | Description |
| --- | --- |
| `Node` | An object with an ID. |
| `TimestampFields` | Shared fields for records that expose creation and update timestamps. |

## Object Types

| Name | Description |
| --- | --- |
| `CreateCustomerPayload` | Autogenerated return type of CreateCustomer. |
| `CreateInvoicePayload` | Autogenerated return type of CreateInvoice. |
| `CreateOrderPayload` | Autogenerated return type of CreateOrder. |
| `CreateProductPayload` | Autogenerated return type of CreateProduct. |
| `CreateProductRequestPayload` | Autogenerated return type of CreateProductRequest. |
| `CreateSupplierPayload` | Autogenerated return type of CreateSupplier. |
| `Customer` | Customer profile that places orders with suppliers. |
| `CustomerConnection` | The connection type for Customer. |
| `CustomerEdge` | An edge in a connection. |
| `DeleteCustomerPayload` | Autogenerated return type of DeleteCustomer. |
| `DeleteOrderPayload` | Autogenerated return type of DeleteOrder. |
| `DeleteProductPayload` | Autogenerated return type of DeleteProduct. |
| `DeleteProductRequestPayload` | Autogenerated return type of DeleteProductRequest. |
| `DeleteSupplierPayload` | Autogenerated return type of DeleteSupplier. |
| `Invoice` | Financial document generated for a supplier/customer pair. |
| `InvoiceConnection` | The connection type for Invoice. |
| `InvoiceEdge` | An edge in a connection. |
| `InvoiceLineItem` | Line item that ties invoices to product requests and orders. |
| `InvoiceLineItemConnection` | The connection type for InvoiceLineItem. |
| `InvoiceLineItemEdge` | An edge in a connection. |
| `MagicInvoiceSubmission` | Record that tracks asynchronous magic invoice ingestion. |
| `MagicInvoiceSubmissionConnection` | The connection type for MagicInvoiceSubmission. |
| `MagicInvoiceSubmissionEdge` | An edge in a connection. |
| `Order` | Purchase order tying together customers, suppliers, and requested products. |
| `OrderConnection` | The connection type for Order. |
| `OrderEdge` | An edge in a connection. |
| `PageInfo` | Information about pagination in a connection. |
| `Product` | Catalog entry offered by a supplier. |
| `ProductConnection` | The connection type for Product. |
| `ProductEdge` | An edge in a connection. |
| `ProductRequest` | Line-level request that links a product to an order. |
| `ProductRequestConnection` | The connection type for ProductRequest. |
| `ProductRequestEdge` | An edge in a connection. |
| `SignInPayload` | Autogenerated return type of SignIn. |
| `SignOutPayload` | Autogenerated return type of SignOut. |
| `SignUpPayload` | Autogenerated return type of SignUp. |
| `SubmitMagicInvoicePayload` | Autogenerated return type of SubmitMagicInvoice. |
| `UpdateCustomerPayload` | Autogenerated return type of UpdateCustomer. |
| `UpdateInvoiceStatusPayload` | Autogenerated return type of UpdateInvoiceStatus. |
| `Supplier` | Vendor profile that owns catalogs, orders, and invoices. |
| `SupplierConnection` | The connection type for Supplier. |
| `SupplierEdge` | An edge in a connection. |
| `UpdateOrderPayload` | Autogenerated return type of UpdateOrder. |
| `UpdateOrderStatusPayload` | Autogenerated return type of UpdateOrderStatus. |
| `UpdateProductPayload` | Autogenerated return type of UpdateProduct. |
| `UpdateProductRequestPayload` | Autogenerated return type of UpdateProductRequest. |
| `UpdateSupplierPayload` | Autogenerated return type of UpdateSupplier. |
| `User` | An authenticated account that owns suppliers, customers, orders, and invoice workflows. |
| `UserConnection` | The connection type for User. |
| `UserEdge` | An edge in a connection. |
| `UserError` | A user-facing error returned by a mutation for validation or authorization feedback. |

## Input Types

| Name | Description |
| --- | --- |
| `CreateCustomerInput` | Autogenerated input type of CreateCustomer. |
| `CreateInvoiceInput` | Autogenerated input type of CreateInvoice. |
| `CreateOrderInput` | Autogenerated input type of CreateOrder. |
| `CreateProductInput` | Autogenerated input type of CreateProduct. |
| `CreateProductRequestInput` | Autogenerated input type of CreateProductRequest. |
| `CreateSupplierInput` | Autogenerated input type of CreateSupplier. |
| `CustomerAttributesInput` | Attributes to apply when creating or updating a customer. |
| `DeleteCustomerInput` | Autogenerated input type of DeleteCustomer. |
| `DeleteOrderInput` | Autogenerated input type of DeleteOrder. |
| `DeleteProductInput` | Autogenerated input type of DeleteProduct. |
| `DeleteProductRequestInput` | Autogenerated input type of DeleteProductRequest. |
| `DeleteSupplierInput` | Autogenerated input type of DeleteSupplier. |
| `InvoiceLineItemInput` | Attributes representing a manual invoice line item selection. |
| `ProductAttributesInput` | Attributes used for creating or updating a product. |
| `ProductRequestCreateInput` | Attributes used to create a product request. |
| `ProductRequestUpdateInput` | Attributes that can be updated on a product request. |
| `SignInCredentialsInput` | Credentials used to authenticate an existing account. |
| `SignInInput` | Autogenerated input type of SignIn. |
| `SignOutInput` | Autogenerated input type of SignOut. |
| `SignUpAttributesInput` | Attributes required to register a new account. |
| `SignUpInput` | Autogenerated input type of SignUp. |
| `SubmitMagicInvoiceInput` | Autogenerated input type of SubmitMagicInvoice. |
| `SupplierAttributesInput` | Attributes used for creating or updating a supplier. |
| `UpdateCustomerInput` | Autogenerated input type of UpdateCustomer. |
| `UpdateInvoiceStatusInput` | Autogenerated input type of UpdateInvoiceStatus. |
| `UpdateOrderInput` | Autogenerated input type of UpdateOrder. |
| `UpdateOrderStatusInput` | Autogenerated input type of UpdateOrderStatus. |
| `UpdateProductInput` | Autogenerated input type of UpdateProduct. |
| `UpdateProductRequestInput` | Autogenerated input type of UpdateProductRequest. |
| `UpdateSupplierInput` | Autogenerated input type of UpdateSupplier. |

## Enums

| Name | Description |
| --- | --- |
| `InvoiceGenerationMethodEnum` | Mechanisms used to generate invoices. |
| `InvoiceStatusEnum` | Lifecycle states for an invoice. |
| `MagicInvoiceSubmissionStatusEnum` | Processing states for a magic invoice submission. |
| `OrderStatusEnum` | Lifecycle states for an order. |
| `ProductRequestStatusEnum` | Workflow states for a product request. |
| `UserTypeEnum` | The available roles for a user account. |
