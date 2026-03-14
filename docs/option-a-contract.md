# Option A Contract Notes

This repo follows **Option A**:

- Keep the OrangePi runtime and Go connector behavior stable.
- Replace or rebuild the KDS side behind the existing connector contract.

## Existing runtime contract to preserve

1. OrangePi Python controller calls local connector gRPC:
   - `GetOrder(tray_number)`
   - `CompleteOrder(order_id, client_id)`
   - `MarkFailedOrder(order_id, client_id, completed_commands, failed_commands)`
2. Connector consumes inbound order events and publishes outbound result events.
3. Command code format must remain compatible (`station_machine`, example: `1_2`).

## What this app should own

- KDS operator UI
- Order lifecycle in Supabase (pending/running/completed/failed/canceled)
- Event publishing/ingestion layer compatible with connector expectations

## Recommended deployment split

- This Tauri + Next app: operator-facing KDS desktop.
- Separate worker service: queue polling, retries, idempotency, and connector-facing integration.
