#!/usr/bin/env bash
# Configura en Cloudflare los registros DNS para recibir email en hola@eraldia.com
# con Proton Mail. Pensado para ejecutarse en TU máquina (necesita tu token de
# Cloudflare). No commitees este fichero con valores reales rellenados.
#
# Antes de ejecutar:
#   1. Cloudflare -> Email -> Email Routing -> DESACTIVAR (si está activo, sus MX
#      bloquean los de Proton y no recibirás nada).
#   2. Proton -> Settings -> All settings -> Domain names -> eraldia.com:
#      copia el TXT de verificación y los 3 valores CNAME de DKIM aquí abajo.
#   3. Crea un API token en Cloudflare con permiso "Zone.DNS:Edit" sobre eraldia.com
#      y expórtalo:  export CF_API_TOKEN=...   (no lo pegues en chats ni en git)
#
# Uso:  CF_API_TOKEN=... bash setup-proton-dns.sh
set -euo pipefail

ZONE_NAME="eraldia.com"

# --- Rellena estos 4 valores con lo que te muestra Proton -------------------
PROTON_VERIFICATION="protonmail-verification=XXXXXXXXXXXXXXXX"
DKIM1="protonmail.domainkey.dXXXXXXXX.domains.proton.ch"
DKIM2="protonmail2.domainkey.dXXXXXXXX.domains.proton.ch"
DKIM3="protonmail3.domainkey.dXXXXXXXX.domains.proton.ch"
# ---------------------------------------------------------------------------

: "${CF_API_TOKEN:?Exporta CF_API_TOKEN con un token Zone.DNS:Edit}"
API="https://api.cloudflare.com/client/v4"
auth=(-H "Authorization: Bearer ${CF_API_TOKEN}" -H "Content-Type: application/json")

# Localiza el zone id del dominio
ZONE_ID=$(curl -s "${auth[@]}" "${API}/zones?name=${ZONE_NAME}" | python3 -c \
  'import sys,json;print(json.load(sys.stdin)["result"][0]["id"])')
echo "Zone: ${ZONE_NAME} -> ${ZONE_ID}"

# Crea un registro (idempotencia básica: avisa si Cloudflare lo rechaza por duplicado)
add() { # tipo nombre contenido [prioridad]
  local type="$1" name="$2" content="$3" prio="${4:-}"
  local data
  if [[ -n "$prio" ]]; then
    data=$(printf '{"type":"%s","name":"%s","content":"%s","priority":%s,"ttl":1,"proxied":false}' "$type" "$name" "$content" "$prio")
  else
    data=$(printf '{"type":"%s","name":"%s","content":"%s","ttl":1,"proxied":false}' "$type" "$name" "$content")
  fi
  echo "-> ${type} ${name}"
  curl -s "${auth[@]}" -X POST "${API}/zones/${ZONE_ID}/dns_records" -d "$data" \
    | python3 -c 'import sys,json;r=json.load(sys.stdin);print("   OK" if r["success"] else "   "+str(r["errors"]))'
}

# Recibir (MX) + verificación de dominio
add TXT "@"                       "$PROTON_VERIFICATION"
add MX  "@"                       "mail.protonmail.ch"    10
add MX  "@"                       "mailsec.protonmail.ch" 20

# SPF (un único registro SPF en la raíz; si ya hay uno, este fallará: edítalo a mano)
add TXT "@"                       "v=spf1 include:_spf.protonmail.ch ~all"

# DKIM (CNAME, sin proxy)
add CNAME "protonmail._domainkey"  "$DKIM1"
add CNAME "protonmail2._domainkey" "$DKIM2"
add CNAME "protonmail3._domainkey" "$DKIM3"

# DMARC
add TXT "_dmarc"                  "v=DMARC1; p=quarantine;"

echo "Hecho. Vuelve a Proton -> Domain names y pulsa Verify."
