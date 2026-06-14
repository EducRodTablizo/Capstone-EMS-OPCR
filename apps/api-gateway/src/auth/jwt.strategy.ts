import { Injectable } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import type { JwtPayload } from '@ems/types'

/**
 * JWT Strategy — validates ARMS-issued JWTs.
 * EMS does NOT issue JWTs. It only validates the signature and extracts claims.
 * In production, replace the secret with ARMS public key (RS256 verification).
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.ARMS_JWT_SECRET ?? 'dev_jwt_secret_change_in_production',
      // Production: secretOrKeyProvider fetching ARMS public key from JWKS endpoint
      // jwksUri: `${process.env.ARMS_BASE_URL}/.well-known/jwks.json`
    })
  }

  /**
   * Called after signature is verified.
   * Returns the object attached to req.user.
   */
  validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      office_id: payload.office_id,
      office_code: payload.office_code,
      office_name: payload.office_name,
    }
  }
}
