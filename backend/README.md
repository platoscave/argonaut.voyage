# Argonaut backend

## Start the blockchain in a Docker container:

First command prompt
```command
docker pull ghcr.io/gofractally/psibase:v0.8.0-pre

docker run --rm -p 8080:8080 -p 3000:3000 -p 9090:9090 ghcr.io/gofractally/psinode:v0.8.0-pre
```
Second command prompt
```command
psibase boot -p prod
```
Try:
- [Featured Applets](http://psibase.127.0.0.1.sslip.io:8080/)
- [Admin Pannel](http://localhost:8080/#Dashboard) (dead link)
- [Graphana](http://localhost:3000/grafana/d/psinode-dashboard/psinode-dashboards?orgId=1&refresh=5s) (dead link)


## Build and deploy the app

If you dont have rustup installed follow the [rustup installation instructions](https://rustup.rs/). 

Run 
```command
rustup update
rustup target add wasm32-wasi
cargo install cargo-psibase

```

Make sure you're in `argonaut.voyage/backend`. Then run 
```command
cargo psibase deploy -ip
```

You can now vist the argonaut actions page: [argonaut](http://argonaut.psibase.127.0.0.1.sslip.io:8080/)


