---
layout: post
title: "Test features"
---

Test web features

## LaTeX 

Test inline $\alpha$ and $\beta$. 

$$f(y|\alpha,\beta) = \frac{\Gamma(\alpha + \beta)}{\Gamma(\alpha)\Gamma(\beta)}
y^{\alpha - 1} (1 - y)^{\beta - 1}$$

## Code highlight

```python
def find_primes_up_to(limit):
    if limit < 2:
        return []

    is_prime = [True] * (limit + 1)
    is_prime[0] = is_prime[1] = False  # 0 and 1 are not primes

    for number in range(2, int(limit**0.5) + 1):
        if is_prime[number]:
            # Mark multiples of the prime number as not prime
            for multiple in range(number*number, limit + 1, number):
                is_prime[multiple] = False

    return [number for number, prime in enumerate(is_prime) if prime]

# Display all prime numbers up to 1000
primes_up_to_1000 = find_primes_up_to(1000)
print(primes_up_to_1000)
```
