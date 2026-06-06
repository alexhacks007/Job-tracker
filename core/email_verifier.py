import re
import dns.resolver
from django.core.validators import validate_email
from django.core.exceptions import ValidationError

def verify_email_deliverability(email):
    """
    Performs high-fidelity email verification:
    1. Syntax check
    2. MX record verification
    3. Disposable domain check
    """
    if not email:
        return {"status": "invalid", "reason": "Empty email"}

    # 1. Syntax Check
    try:
        validate_email(email)
    except ValidationError:
        return {"status": "invalid", "reason": "Malformed syntax"}

    domain = email.split('@')[-1]

    # 2. Disposable Email Check (Simplified)
    disposable_domains = ['mailinator.com', 'guerrillamail.com', 'tempmail.com', '10minutemail.com']
    if domain.lower() in disposable_domains:
        return {"status": "risky", "reason": "Disposable email provider"}

    # 3. MX Record Check (DNS)
    try:
        mx_records = dns.resolver.resolve(domain, 'MX')
        if not mx_records:
            return {"status": "invalid", "reason": "No MX records found"}
        
        # Catch Ghost Domains (MX pointing to localhost/loopback)
        for rdata in mx_records:
            mx_host = str(rdata.exchange).lower()
            if 'localhost' in mx_host or '127.0.0.1' in mx_host or domain.lower() in mx_host:
                return {"status": "invalid", "reason": "Ghost Domain (Loopback MX record)"}

    except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN, dns.resolver.Timeout):
        return {"status": "invalid", "reason": "Domain does not exist or cannot receive mail"}
    except Exception:
        return {"status": "unknown", "reason": "DNS resolution failed"}

    return {"status": "valid", "reason": "Syntax and MX records verified"}
