Purpose

Introduces cross-user correlation analysis. This lesson teaches how systems detect coordinated activity across multiple identities using shared attributes.

Security Concept
Group
Cross-User Correlation Detection
Subgroups
Shared Attribute Tracking

User Grouping

Coordinated Behavior Detection
Core Python Pattern
ip_group = state["ips"].setdefault(ip, set())

ip_group.add(user)

if len(ip_group) > 2:
    return "FRAUD"
