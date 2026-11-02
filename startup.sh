#!/bin/sh
set -eu
cd "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
# Keep revive and local Windows startup on the same fixed-port implementation.
node scripts/dev-server.mjs
