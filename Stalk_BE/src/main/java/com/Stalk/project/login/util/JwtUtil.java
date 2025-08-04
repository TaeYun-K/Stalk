package com.Stalk.project.login.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import javax.crypto.SecretKey;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component
public class JwtUtil {

  @Value("${jwt.secret}")
  private String secret;
  private SecretKey key;

  @Value("${jwt.access-token-validity}")
  private long accessTokenValidity;

  @Getter
  @Value("${jwt.refresh-token-validity}")
  private long refreshTokenValidity;

  @PostConstruct
  public void init() {
    // base64 디코딩
    byte[] keyBytes = Decoders.BASE64.decode(secret);
    // HMAC-SHA 키 객체 생성
    this.key = Keys.hmacShaKeyFor(keyBytes);
  }

  public String createAccessToken(String userId, String role) {
    return createToken(userId, role, accessTokenValidity);
  }

  public String createRefreshToken(String userId, String role) {
    return createToken(userId, role, refreshTokenValidity);
  }

  private String createToken(String userId, String role, long validity) {
    Claims claims = Jwts.claims().setSubject(userId);
    claims.put("role", role);
    Date now = new Date();
    Date expiryDate = new Date(now.getTime() + validity);

    return Jwts.builder()
        .setClaims(claims)
        .setIssuedAt(now)
        .setExpiration(expiryDate)
        .signWith(key, SignatureAlgorithm.HS512)
        .compact();
  }

  public String getUserIdFromToken(String token) {
    JwtParser parser = Jwts.parserBuilder()
        .setSigningKey(key)
        .build();
    Claims claims = parser.parseClaimsJws(token).getBody();
    return claims.getSubject();
  }

  public String getRoleFromToken(String token) {
    JwtParser parser = Jwts.parserBuilder()
        .setSigningKey(key)
        .build();
    Claims claims = parser.parseClaimsJws(token).getBody();
    return claims.get("role", String.class);
  }

  public boolean validateToken(String token) {
    try {
      Jwts.parserBuilder()
          .setSigningKey(key)
          .build()
          .parseClaimsJws(token);
      return true;
    } catch (Exception e) {
      return false;
    }
  }

  public long getRemainingValidity(String token) {
    try {
      Claims claims = Jwts.parserBuilder()
          .setSigningKey(key)
          .build()
          .parseClaimsJws(token)
          .getBody();

      Date expiration = claims.getExpiration();
      return expiration.getTime() - System.currentTimeMillis();
    } catch (JwtException | IllegalArgumentException e) {
      return -1;
    }
  }

}