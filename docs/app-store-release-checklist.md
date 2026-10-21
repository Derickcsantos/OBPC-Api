# OBPC mobile store release checklist

This checklist reflects the repository audit on 2026-10-20. The code changes do not submit the app or complete developer-console declarations.

## Prepared in the repositories

- Public HTTPS pages are served by both Fastify and the Cloudflare Worker: `/privacy-policy`, `/terms-of-use`, and `/delete-account`.
- The Expo sidebar links to the privacy policy and terms for signed-in and signed-out users.
- The external deletion page authenticates the existing Google identity, asks for a second explicit confirmation, then calls the existing account deletion endpoint. It does not create an account as a side effect.
- The iOS privacy manifest now declares first-party account, contact, religious/sensitive, user-content, photo, interaction, search, and diagnostic data categories. It declares no tracking; confirm that against the final binary and third-party SDK manifests.
- The iOS and Android identifiers are configured as `com.obpcapp`; Expo project/build configuration exists.

## Required before submission

1. Replace `[PREENCHER A IDENTIFICA...` in the public policy and terms with the verified legal entity and CNPJ. Confirm the address and privacy contact number, name an LGPD contact/encarregado or publish the designated channel, and obtain the organization's approval of the text. The currently available public name and WhatsApp number were taken from the app's About screen.
2. Have the controller document the LGPD legal basis for each purpose, especially the sensitive religious data. The app currently has no recorded, specific consent event for saving ministry interests, prayer interactions, highlights, notes, or devotional progress. Implement and deploy a consent flow if consent is the chosen legal basis; a policy page alone is not consent.
3. Apple Guideline 4.8: the app currently offers Google as its only social login. Add and configure an equivalent login that permits hiding the email (commonly Sign in with Apple), or verify and document a valid exception before iOS submission. The Apple capability requires the App ID/team signing configuration and a new native build.
4. In Google Play Console, enter the public privacy-policy URL and `/delete-account` URL. Complete Data safety and Data deletion declarations. Review name, email, account ID, phone, religious/sensitive content, annotations, photos, saved interactions/searches, diagnostics, IP/log data, Google sign-in, Supabase, Cloudflare, Bible API, Redis/cache, and YouTube against the production SDK/provider configuration.
5. In App Store Connect, enter `/privacy-policy` and complete App Privacy for first-party and all third-party SDK/provider practices. Confirm collected data types/purposes and privacy manifests from the final archive; the checked-in first-party manifest cannot declare vendor SDK practices for them.
6. Confirm the target age groups and IARC/App Store age ratings from the actual intended audience and content. The repository alone cannot establish whether children are an intended audience.
7. Confirm rights/licenses for the Bible text/translation, music and embedded YouTube media, photos, logos, and all content shown in the app. Apple requires permission for third-party services/materials.
8. Configure and verify Google OAuth authorized origins for the deployed deletion page, test account deletion against the deployed Worker and production database, and confirm the store deletion URL is public, HTTPS, non-geofenced, and works without installing the app.
9. Confirm release signing, production API bindings, store listing/support contact, screenshots, version/build numbers, export-compliance answers, review credentials/instructions, and physical-device tests for both platforms.

## References

- Google Play privacy policy and account deletion requirements: https://support.google.com/googleplay/android-developer/answer/13327111
- Google Play Data safety and user-data policy: https://support.google.com/googleplay/android-developer/answer/10787469
- Apple App Review Guidelines, especially 4.8 and 5.1: https://developer.apple.com/app-store/review/guidelines/
- Apple App Privacy details: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy
- Apple privacy manifests: https://developer.apple.com/documentation/bundleresources/describing-data-use-in-privacy-manifests
- Brazilian LGPD: https://www.gov.br/mj/pt-br/assuntos/sua-protecao/sedigi/Lei13709.pdf
