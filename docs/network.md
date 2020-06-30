# Network

Underlying, the import stream may use HTTPs requests. The current implementation utilises node-fetch/encoding with a wrapped read/write bottleneck. This is aimed at providing a reaonsable rate limit approach to a low-spec external read/write source.

Request such as GET/OPTIONS fall under a READ limit, and the POST/PUT/PATCH calls fall under a WRITE limit.

There is a planned ioc container being added to the import-streams service, which will allow you to provide your own network service, but for now, the limits are exposed with several environment variables if you wish to modify the rate-limiting.

## Environment variables

- `NETWORK_READ_MAX_CONCURRENT` defaults to 5
- `NETWORK_READ_MIN_TIME` defaults to 200, or 1000 / NETWORK_READ_MAX_CONCURRENT
- `NETWORK_WRITE_MAX_CONCURRENT` defaults to 2
- `NETWORK_WRITE_MIN_TIME` defaults to 500, or 1000 / NETWORK_WRITE_MAX_CONCURRENT
