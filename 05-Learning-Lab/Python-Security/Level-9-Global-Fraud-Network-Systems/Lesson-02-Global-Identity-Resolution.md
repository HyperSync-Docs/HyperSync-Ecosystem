Purpose

Introduces global identity resolution and teaches how fraud detection systems link identities across multiple organizations, platforms, and environments.

Fraud actors rarely use a single identity.

Instead they rotate:

Email Addresses

Phone Numbers

Devices

IP Addresses

Accounts

Organizations

to avoid detection.

Traditional systems see:

Many Identities

while advanced fraud systems discover:

One Actor

Global identity resolution converts fragmented observations into unified intelligence.

Security Concept
Group
Global Identity Resolution
Subgroups
Cross-System Identity Linking
Connect identities across organizations.

Discover shared actors.

Reduce visibility gaps.
Identity Normalization
Standardize identifiers.

Normalize formats.

Improve matching accuracy.
Resolution Confidence
Assign confidence scores.

Prevent incorrect correlations.

Support explainable linking.

These controls establish a global identity intelligence layer.

Explanation

Example:

global_id = resolve(
    user_id,
    device,
    ip
)

Process:

Email

+

Phone

+

Device

+

IP

↓

Resolution Engine

↓

Global Identity

The objective is not perfect certainty.

The objective is:

High Confidence Identity Linking

that improves fraud detection quality.

HyperSync Alignment

Directly aligns with:

Identity Intelligence

Cross-Lender Intelligence

Fraud Ring Detection

Partner Intelligence

AI Security Monitoring

Future Fraud Engine

HyperSync Principle:

Many Identifiers

One Entity
Protection Code Notes
Resolution Function
resolve()

Explanation:

Combines identity signals.

Generates unified identity.

Improves visibility.
Device Correlation
device

Explanation:

Links otherwise separate accounts.

Detects reuse patterns.
Confidence Score
confidence

Explanation:

Measures linking certainty.

Prevents false associations.
Combined Protection
Identity Linking

+

Normalization

+

Confidence Scoring

Creates global identity intelligence.

Real-World Scenario

Organization A observes:

Email A

Device X

Organization B observes:

Email B

Device X

Organization C observes:

Email C

Device X

Identity Resolution:

Shared Device

↓

Unified Identity

↓

Fraud Actor Identified
Acronyms
ID
Identifier

PII
Personally Identifiable Information

IAM
Identity and Access Management
Attack Examples
Identifier Rotation
Attacker changes email repeatedly.

Protection:

Device and IP correlation.
Synthetic Identity Creation
Multiple fake identities generated.

Protection:

Cross-signal identity linking.
Account Farming
Large volumes of accounts created.

Protection:

Shared entity resolution.
Build Exercise

Create a Python function that:

Accepts:

Email

Device

IP

Generates:

Global Identity

Confidence Score

Example:

resolve_identity(
    email,
    device,
    ip
)

Returns:

Global_ID

Confidence = 0.94
Expected Outcome
Identity Resolution

Entity Linking

Confidence Scoring

Cross-System Correlation

Fraud Actor Detection
