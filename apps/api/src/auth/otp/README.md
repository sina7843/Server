# Dragon API OTP Challenge Foundation

This directory contains the Slice 0.2 OTP challenge persistence and state-helper foundation.

It includes only:

- the `OtpChallenge` Mongoose schema;
- safe repository methods for future OTP flows;
- minimal service helpers for OTP challenge state checks;
- unit tests that do not require a real MongoDB connection.

This directory does not implement Auth endpoints, OTP generation, OTP hashing, SMS sending, Redis rate limits, password reset flows, admin step-up flows, or product behavior.

Raw OTP codes must never be stored or logged. The schema stores only `codeHash`, which is provided by later flow code.
