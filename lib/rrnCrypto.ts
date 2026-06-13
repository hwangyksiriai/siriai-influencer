/**
 * 주민등록번호 암호화 — AES-256-GCM (서버 전용, node:crypto)
 * 저장 형식: "enc:" + base64( iv(12) | authTag(16) | ciphertext )
 * 복호화는 평문(legacy)도 그대로 통과시켜 하위호환.
 * 키: RRN_SECRET 파생 — 어드민 앱(siriai-admin)과 반드시 동일 값이어야 함.
 */
import { createCipheriv, createDecipheriv, scryptSync, randomBytes } from 'crypto'

const PREFIX = 'enc:'
let cachedKey: Buffer | null = null

function key(): Buffer {
  if (cachedKey) return cachedKey
  const secret = process.env.RRN_SECRET || 'siriai-rrn-dev'
  cachedKey = scryptSync(secret, 'siriai-rrn-salt-v1', 32)
  return cachedKey
}

export function encryptRRN(plain: string): string {
  if (!plain) return plain
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return PREFIX + Buffer.concat([iv, tag, enc]).toString('base64')
}

export function decryptRRN(stored: string | null | undefined): string {
  if (!stored) return ''
  if (!stored.startsWith(PREFIX)) return stored // legacy 평문
  try {
    const raw = Buffer.from(stored.slice(PREFIX.length), 'base64')
    const iv = raw.subarray(0, 12)
    const tag = raw.subarray(12, 28)
    const data = raw.subarray(28)
    const decipher = createDecipheriv('aes-256-gcm', key(), iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
  } catch {
    return '(복호화 실패)'
  }
}
