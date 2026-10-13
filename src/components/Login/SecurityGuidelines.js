/* eslint-disable prettier/prettier, react/no-unescaped-entities */
import React from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  Typography,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function SecurityGuidelines({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ pb: 0 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Security Guidelines</Typography>
          <IconButton aria-label="close" onClick={onClose} size="large">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ maxHeight: "70vh", overflowY: "auto" }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          Sample Bank – Supply Chain Finance Portal
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          1. Introduction
        </Typography>
        <Typography paragraph>
          Sample Bank is committed to maintaining the security, confidentiality, and integrity of
          information and transactions processed through the Supply Chain Finance (SCF) Portal.
        </Typography>
        <Typography paragraph>
          Users are required to follow these Security Guidelines to protect their accounts,
          credentials, business information, and SCF transactions.
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          2. User ID &amp; Password Security
        </Typography>
        <Typography paragraph>
          Users shall:
        </Typography>
        <Typography paragraph>
          - Keep User ID, Password, and other authentication credentials confidential.
          <br />- Never share passwords with any other person, including Bank employees or
          support personnel.
          <br />- Use strong and unique passwords as required by the Bank.
          <br />- Change passwords periodically or immediately if compromise is suspected.
          <br />- Avoid using easily identifiable information such as names, birthdays, or company
          details as passwords.
          <br />- Never save passwords in publicly accessible or shared systems.
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          3. Multi-Factor Authentication (MFA)
        </Typography>
        <Typography paragraph>
          - Users may be required to authenticate using MFA, OTP, or other security mechanisms
          implemented by the Bank.
          <br />- OTP and authentication codes must never be shared with anyone.
          <br />- Users should not approve or authenticate transactions they did not initiate.
          <br />- Any unexpected OTP, login alert, or authentication request should be reported to
          the Bank immediately.
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          4. Invoice &amp; Document Security
        </Typography>
        <Typography paragraph>
          Users shall:
        </Typography>
        <Typography paragraph>
          - Upload only genuine and authorized invoices, purchase orders, and supporting
          documents.
          <br />- Ensure that documents do not contain malicious files, scripts, or unauthorized
          content.
          <br />- Verify invoice and purchase order details before submitting them for processing
          or financing.
          <br />- Not upload duplicate, altered, fabricated, or fraudulent documents.
          <br />- Protect confidential business and financial information contained in uploaded
          documents.
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          5. Transaction Security
        </Typography>
        <Typography paragraph>
          Before submitting an SCF transaction, users should verify:
        </Typography>
        <Typography paragraph>
          - Buyer and supplier details
          <br />- Invoice number and invoice date
          <br />- Invoice amount and applicable deductions
          <br />- Purchase order details, where applicable
          <br />- Bank account and payment details
          <br />- Financing and settlement information
        </Typography>
        <Typography paragraph>
          Users should carefully review transaction details before final submission, as processed
          transactions may not be reversible.
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          6. Device &amp; Network Security
        </Typography>
        <Typography paragraph>
          Users should:
        </Typography>
        <Typography paragraph>
          - Access the SCF Portal only from trusted and secure devices.
          <br />- Keep operating systems, browsers, and security software updated.
          <br />- Avoid accessing the portal through unsecured public Wi-Fi networks.
          <br />- Use a trusted and secure network when performing financial transactions.
          <br />- Lock or log out of the device when it is unattended.
          <br />- Avoid accessing the portal from shared or public computers whenever possible.
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          7. Phishing &amp; Fraud Prevention
        </Typography>
        <Typography paragraph>
          Users should remain alert to fraudulent emails, messages, websites, and calls attempting
          to obtain credentials or transaction information.
        </Typography>
        <Typography paragraph>
          Users shall:
        </Typography>
        <Typography paragraph>
          - Verify the authenticity of emails and links before clicking them.
          <br />- Access the SCF Portal using the Bank's official portal address rather than unknown
          links.
          <br />- Never provide passwords, OTPs, PINs, or authentication information through
          email, phone, or messaging platforms.
          <br />- Be cautious of requests to modify beneficiary, bank account, or payment details.
          <br />- Report suspected phishing, fraud, or social-engineering attempts immediately.
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          8. Session Security
        </Typography>
        <Typography paragraph>
          - Users should log out of the SCF Portal after completing their activities.
          <br />- Users should not leave an active portal session unattended.
          <br />- The portal may automatically terminate inactive sessions as a security measure.
          <br />- Users should close browser sessions after logging out, particularly when using
          shared devices.
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          9. Access Control
        </Typography>
        <Typography paragraph>
          - Users must access only the functions and information authorized for their role.
          <br />- Users must not attempt to access another user's account or restricted information.
          <br />- User access may be monitored and reviewed by the Bank for security and
          compliance purposes.
          <br />- Access may be suspended or revoked in case of suspected misuse, unauthorized
          access, or security violations.
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          10. Reporting Security Incidents
        </Typography>
        <Typography paragraph>
          Users must immediately report the following to the Bank:
        </Typography>
        <Typography paragraph>
          - Suspected unauthorized access
          <br />- Lost or compromised credentials
          <br />- Unexpected OTPs or login notifications
          <br />- Suspicious transactions
          <br />- Fraudulent or altered invoices or documents
          <br />- Phishing emails, websites, or messages
          <br />- Any other suspected security incident
        </Typography>
        <Typography paragraph>
          Users should provide relevant details, such as the date and time of the incident and
          transaction or reference details, where available.
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          11. Bank Security Measures
        </Typography>
        <Typography paragraph>
          The Bank may implement appropriate security controls to protect the SCF Portal and
          associated information, including:
        </Typography>
        <Typography paragraph>
          - Multi-Factor Authentication (MFA) and OTP-based authentication
          <br />- SSL/TLS encryption
          <br />- Web Application Firewall (WAF) protection
          <br />- Role-Based Access Control (RBAC)
          <br />- Continuous security monitoring
          <br />- Audit logging and transaction monitoring
          <br />- Fraud and anomaly detection mechanisms
          <br />- Regular security assessments and system updates
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          12. User Responsibility
        </Typography>
        <Typography paragraph>
          Security of the SCF Portal is a shared responsibility. Users are responsible for
          protecting their credentials, devices, documents, and transaction information and for
          following the Bank's security requirements.
        </Typography>
        <Typography paragraph>
          The Bank will never ask users to disclose their password, OTP, PIN, or other confidential
          authentication credentials through email, phone, or messaging channels.
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          13. Security Updates
        </Typography>
        <Typography paragraph>
          The Bank may update these Security Guidelines from time to time to address emerging
          security threats, regulatory requirements, technology changes, or improvements to the
          SCF Portal's security controls. Users are advised to periodically review the latest
          Security Guidelines and comply with all applicable security requirements.
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          14. Contact
        </Typography>
        <Typography paragraph>
          Sample Bank
          <br />Trade Finance Division, 2nd Floor, 100 Commerce Avenue, Sample City – 000001
          <br />Email: support@samplebank.com
        </Typography>
      </DialogContent>

      <DialogActions sx={{ pr: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained" sx={{ backgroundColor: "#1976d2" }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

SecurityGuidelines.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
