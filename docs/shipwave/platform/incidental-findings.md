# Incidental findings

- The repository lacks the `docs/README.md` requested by the workspace instructions. This planning task did not create it because ownership is limited to the named programme files.
- Product-design documentation describes concepts and proposed behavior; it explicitly does not establish implementation state. Specs must verify each code claim.
- Do not claim a tenant leak based on the current audit: global auth guard validates memberships. Preserve that known behavior in any tenancy findings and test only evidence-backed boundaries.
- Swagger/OpenAPI is present; CI/API work should strengthen contract verification rather than claim Swagger is absent.
