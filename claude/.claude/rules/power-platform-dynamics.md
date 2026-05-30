---
paths: "**/solution.xml,**/*.sppkg,**/customizations.xml,**/*.cdsproj"
---


# Power Platform & Dynamics 365

- Solutions are managed and source-controlled. Never edit directly in production. ALM runs through pipelines across dev, test, UAT, prod.
- Enforce DLP policies and a defined environment strategy. Reusable components live in the Centre of Excellence library, not copied per project.
- Custom code (plugins, PCF, custom connectors) is the exception, used only when configuration genuinely cannot meet the requirement. Justify it in writing.
- Dataverse is the system of record for business-application data. Integrate outward through APIs and custom connectors; no direct table writes from external systems.
- Apply Microsoft Responsible AI and Purview controls where Copilot, AI Builder, or sensitive data is in scope.
