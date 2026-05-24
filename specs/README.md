# FASTag Chain Reaction — API Spec

This directory holds the machine-readable contract for the FASTag Chain Reaction backend.

- `openapi.yaml` — OpenAPI 3.1 specification covering every public endpoint.

The spec is the single source of truth: client SDKs (Android/iOS/Web), the NHAI dashboard,
and the mock server used by the mobile team are all generated from it.

---

## 1. View the spec locally

### Swagger UI (Docker one-liner)

```bash
docker run --rm -p 8088:8080 \
  -e SWAGGER_JSON=/spec/openapi.yaml \
  -v "$(pwd):/spec" \
  swaggerapi/swagger-ui
```

Then open <http://localhost:8088>. The container reloads on file changes if you keep it
running while editing `openapi.yaml`.

### Redoc (Docker one-liner)

```bash
docker run --rm -p 8089:80 \
  -v "$(pwd)/openapi.yaml:/usr/share/nginx/html/openapi.yaml" \
  -e SPEC_URL=openapi.yaml \
  redocly/redoc
```

Then open <http://localhost:8089>.

### Stoplight Elements (no install required)

The simplest path is the hosted viewer at <https://elements-demo.stoplight.io/>: paste the
raw URL of `openapi.yaml` (e.g. a GitHub raw URL) into the "OpenAPI URL" field.

For an offline workflow, install [Stoplight Studio](https://stoplight.io/studio) and open
this folder — Studio detects `openapi.yaml` automatically and provides a richer editing UI.

### Redocly CLI

```bash
# install once
npm install -g @redocly/cli

# serve a hot-reloading preview at http://localhost:8080
redocly preview-docs openapi.yaml

# lint against the default ruleset
redocly lint openapi.yaml

# bundle into a single JSON artifact (handy for CI)
redocly bundle openapi.yaml -o openapi.bundled.json
```

---

## 2. Validate the spec online

Any of the following will accept the raw YAML or a public URL to it:

- Swagger Editor — <https://editor-next.swagger.io/>
- Redocly online linter — <https://redocly.com/tools/api-linting/>
- Stoplight Spectral playground — <https://stoplight.io/p/docs/gh/stoplightio/spectral>
- APITools validator — <https://apitools.dev/swagger-parser/online/>

A local YAML-parse sanity check (used by CI):

```bash
python3 -c "import yaml; yaml.safe_load(open('openapi.yaml')); print('ok')"
```

A structural OpenAPI 3.1 check:

```bash
npx --yes @redocly/cli@latest lint openapi.yaml
```

---

## 3. Generate client SDKs

We use [openapi-generator](https://openapi-generator.tech/) for all three target SDKs. The
easiest way to invoke it is via the official Docker image so contributors don't need a
JVM installed locally.

### Kotlin (Android)

```bash
docker run --rm \
  -v "$(pwd):/local" \
  openapitools/openapi-generator-cli generate \
    -i /local/openapi.yaml \
    -g kotlin \
    --library jvm-retrofit2 \
    --additional-properties=serializationLibrary=kotlinx_serialization,useCoroutines=true \
    -o /local/sdk/kotlin \
    --package-name com.fastagchain.api
```

### Swift (iOS)

```bash
docker run --rm \
  -v "$(pwd):/local" \
  openapitools/openapi-generator-cli generate \
    -i /local/openapi.yaml \
    -g swift5 \
    --additional-properties=responseAs=AsyncAwait,projectName=FastagChainAPI \
    -o /local/sdk/swift
```

### TypeScript (Web / NHAI dashboard / Node services)

```bash
docker run --rm \
  -v "$(pwd):/local" \
  openapitools/openapi-generator-cli generate \
    -i /local/openapi.yaml \
    -g typescript-fetch \
    --additional-properties=supportsES6=true,typescriptThreePlus=true,npmName=@fastagchain/api-client \
    -o /local/sdk/typescript
```

> **Tip:** if you'd rather generate without Docker, install the CLI with
> `npm install -g @openapitools/openapi-generator-cli` and replace
> `docker run --rm -v "$(pwd):/local" openapitools/openapi-generator-cli` with
> `openapi-generator-cli` in any of the commands above.

### Alternative: orval (TypeScript only, lighter)

```bash
npx --yes orval --input openapi.yaml --output ./sdk/typescript-orval/index.ts
```

---

## 4. Editing workflow

1. Edit `openapi.yaml`.
2. Run `python3 -c "import yaml; yaml.safe_load(open('openapi.yaml'))"` to confirm it parses.
3. Run `npx @redocly/cli lint openapi.yaml` to catch structural / 3.1-compliance issues.
4. Preview with `redocly preview-docs openapi.yaml` and click through every endpoint.
5. Commit the spec and (when bumped) regenerate the affected SDKs in `sdk/`.
