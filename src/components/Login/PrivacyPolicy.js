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

export default function PrivacyPolicy({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ pb: 0 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Privacy Policy</Typography>
          <IconButton aria-label="close" onClick={onClose} size="large">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ maxHeight: "70vh", overflowY: "auto" }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          Sample Bank – Supply Chain Finance Portal
        </Typography>

        <Typography paragraph>
          Sample Bank (&quot;the Bank&quot;) is committed to protecting the privacy and confidentiality of
          its customers, users, suppliers, buyers, and other stakeholders. This Privacy Policy
          explains how information is collected, used, stored, and protected when users access
          and use the Bank&apos;s Supply Chain Finance (SCF) Portal and related services.
        </Typography>

        <Typography paragraph>
          By accessing or using the SCF Portal, you agree to the terms of this Privacy Policy.
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          1. Introduction
        </Typography>
        <Typography paragraph>
          Sample Bank is committed to protecting the privacy, confidentiality, and security of
          information shared by users of its Supply Chain Finance Portal.
        </Typography>
        <Typography paragraph>
          The SCF Portal enables eligible customers, buyers, suppliers, and other authorized
          participants to manage supply chain finance activities, including invoice submission,
          financing requests, transaction processing, and related services.
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          2. Information We Collect
        </Typography>
        <Typography paragraph sx={{ fontWeight: 700 }}>
          a) Personal Information
        </Typography>
        <Typography paragraph>
          - Name, address, email ID, and contact number
          <br />- Customer, supplier, buyer, and user IDs
          <br />- Account and banking details
          <br />- KYC-related information and documents
          <br />- Authorized signatory and business representative details
        </Typography>

        <Typography paragraph sx={{ fontWeight: 700 }}>b) Business and Transactional Information</Typography>
        <Typography paragraph>
          - Purchase orders and invoice details
          <br />- Invoice amounts, dates, and payment terms
          <br />- Financing and disbursement details
          <br />- Buyer and supplier information
          <br />- Bank account and payment details
          <br />- Transaction history and related documentation
          <br />- Portal activity and transaction status
        </Typography>

        <Typography paragraph sx={{ fontWeight: 700 }}>c) Technical Information</Typography>
        <Typography paragraph>
          - IP address, browser type, and device details
          <br />- Login timestamps and session information
          <br />- Cookies and usage analytics
          <br />- System and application logs
          <br />- Security and audit-related information
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          3. Purpose of Data Collection
        </Typography>
        <Typography paragraph>
          The collected information may be used for:
        </Typography>
        <Typography paragraph>
          - Processing and managing SCF transactions
          <br />- Invoice and purchase order validation and processing
          <br />- Customer, buyer, and supplier authentication and authorization
          <br />- Financing assessment and transaction processing
          <br />- Payment and settlement processing
          <br />- Regulatory, legal, and compliance requirements
          <br />- Fraud detection and prevention
          <br />- Risk assessment and security monitoring
          <br />- Maintaining audit trails and transaction records
          <br />- Improving portal functionality, performance, and user experience
          <br />- Providing support and resolving transaction-related queries
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          4. Data Sharing and Disclosure
        </Typography>
        <Typography paragraph>
          The Bank does not sell or rent personal information. Information may, however, be
          shared where necessary with:
        </Typography>
        <Typography paragraph>
          - Regulatory authorities and government agencies, as required by applicable law
          <br />- Authorized service providers, technology partners, and vendors under
          appropriate confidentiality and security obligations
          <br />- Participating buyers, suppliers, and other authorized SCF participants where
          required for processing transactions
          <br />- Financial institutions, payment networks, or other authorized entities involved in
          transaction processing
          <br />- Law enforcement agencies, where required by law or regulatory requirements
        </Typography>
        <Typography paragraph>
          Information will be shared only to the extent necessary for the relevant purpose and in
          accordance with applicable laws and regulations.
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          5. Data Security
        </Typography>
        <Typography paragraph>
          The Bank implements appropriate technical and organizational security measures to
          protect information processed through the SCF Portal, including:
        </Typography>
        <Typography paragraph>
          - SSL/TLS encryption for secure communication
          <br />- Multi-Factor Authentication (MFA) / OTP-based authentication
          <br />- Web Application Firewall (WAF) protection
          <br />- Role-based access controls
          <br />- Secure authentication and authorization mechanisms
          <br />- Continuous security monitoring and audit logging
          <br />- Access controls and monitoring for sensitive information
          <br />- Security controls for document and transaction processing
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          6. Data Retention
        </Typography>
        <Typography paragraph>
          Information collected through the SCF Portal, including transaction records, invoices,
          purchase orders, financing records, and related documents, is retained in accordance
          with applicable regulatory requirements and the Bank's internal policies.
        </Typography>
        <Typography paragraph>
          Information is securely disposed of or anonymized when the applicable retention period
          expires, subject to legal, regulatory, audit, or other legitimate requirements.
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          7. User Responsibilities
        </Typography>
        <Typography paragraph>
          Users are responsible for:
        </Typography>
        <Typography paragraph>
          - Maintaining the confidentiality of their login credentials
          <br />- Not sharing passwords, OTPs, or authentication information
          <br />- Ensuring that information and documents submitted through the portal are
          accurate and authorized for submission
          <br />- Logging out after completing portal activities
          <br />- Using the portal only for authorized business purposes
          <br />- Reporting any suspected unauthorized access, fraudulent activity, or security
          incident immediately
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          8. Cookies Policy
        </Typography>
        <Typography paragraph>
          The SCF Portal may use cookies and similar technologies to:
        </Typography>
        <Typography paragraph>
          - Maintain secure user sessions
          <br />- Enhance portal functionality and user experience
          <br />- Remember user preferences
          <br />- Analyze portal usage and performance
          <br />- Support security and fraud prevention
        </Typography>
        <Typography paragraph>
          Users may control or manage cookie settings through their browser, subject to the
          impact this may have on certain portal functionalities.
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          9. Third-Party Links
        </Typography>
        <Typography paragraph>
          The SCF Portal may contain links to external websites, systems, or services operated by
          third parties.
        </Typography>
        <Typography paragraph>
          The Bank is not responsible for the privacy practices, security, or content of such
          external websites or services. Users are advised to review the applicable privacy
          policies before providing information to third-party websites.
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          10. User Rights
        </Typography>
        <Typography paragraph>
          Subject to applicable laws and regulatory requirements, users may:
        </Typography>
        <Typography paragraph>
          - Request access to their personal information held by the Bank
          <br />- Request correction of inaccurate or incomplete information
          <br />- Raise queries or concerns regarding the processing of their personal information
          <br />- Contact the Bank regarding data protection and privacy-related matters
        </Typography>
        <Typography paragraph>
          Certain requests may be subject to applicable legal, regulatory, contractual, or security
          requirements.
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          11. Changes to Privacy Policy
        </Typography>
        <Typography paragraph>
          The Bank reserves the right to update or modify this Privacy Policy from time to time to
          reflect changes in applicable laws, regulations, technology, or portal functionality.
        </Typography>
        <Typography paragraph>
          Any material changes may be communicated through the SCF Portal or other appropriate
          channels. Users are advised to periodically review this Privacy Policy for the latest
          information.
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          12. Contact Information
        </Typography>
        <Typography paragraph>
          For any queries, requests, or concerns regarding this Privacy Policy or the processing of
          personal information, please contact:
        </Typography>
        <Typography paragraph sx={{ fontWeight: 700 }}>
          Sample Bank
        </Typography>
        <Typography paragraph>
          Address: Trade Finance Division, 2nd Floor, 100 Commerce Avenue, Sample City – 000001
          <br />Email: support@samplebank.com
        </Typography>

        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
          Disclaimer
        </Typography>
        <Typography paragraph>
          This Privacy Policy is subject to applicable laws, regulations, regulatory guidelines,
          and the Bank's internal policies, including applicable provisions of the Information
          Technology Act, 2000, and applicable data protection and privacy regulations, as
          amended from time to time.
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

PrivacyPolicy.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
