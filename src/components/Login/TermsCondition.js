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

export default function TermsCondition({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ pb: 0 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Terms &amp; Conditions</Typography>
          <IconButton aria-label="close" onClick={onClose} size="large">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ maxHeight: "70vh", overflowY: "auto" }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          Sample Bank – Supply Chain Finance Portal
        </Typography>

        <Typography paragraph sx={{ fontWeight: 700 }}>1. Acceptance of Terms</Typography>
        <Typography paragraph>
          By accessing and using the Bank&apos;s Supply Chain Finance (SCF) Portal, users agree to
          comply with these Terms and Conditions and all applicable laws, regulations, and
          regulatory provisions.
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          2. User Eligibility
        </Typography>
        <Typography paragraph>
          - Access is restricted to authorized buyers, suppliers, customers, branch users, and
          internal Bank staff.
          <br />- Users must have valid credentials issued or authorized by the Bank.
          <br />- Users must be duly authorized to act on behalf of the organization or entity they
          represent.
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          3. User Obligations
        </Typography>
        <Typography paragraph>
          Users shall:
        </Typography>
        <Typography paragraph>
          - Maintain confidentiality of User ID, Password, OTP, and other authentication
          credentials.
          <br />- Ensure that all information, invoices, purchase orders, and documents submitted
          through the portal are accurate, complete, and authorized.
          <br />- Use the portal only for legitimate and authorized SCF activities.
          <br />- Immediately report unauthorized access, suspicious activity, or incorrect
          transactions to the Bank.
          <br />- Ensure that submitted invoices and related documents are genuine and valid.
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          4. Prohibited Activities
        </Typography>
        <Typography paragraph>
          Users shall not:
        </Typography>
        <Typography paragraph>
          - Attempt unauthorized access, hacking, data extraction, or circumvention of portal
          security controls.
          <br />- Upload malicious content, viruses, corrupted files, or unauthorized documents.
          <br />- Submit fraudulent, duplicate, altered, or fictitious invoices or purchase orders.
          <br />- Misuse portal functionalities or initiate unauthorized financing or payment
          transactions.
          <br />- Share portal credentials or provide access to unauthorized persons.
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          5. Authentication &amp; Security
        </Typography>
        <Typography paragraph>
          - Access to the SCF Portal may be protected through Multi-Factor Authentication (MFA),
          OTP, or other authentication mechanisms implemented by the Bank.
          <br />- Portal activities and transactions may be logged, monitored, and audited for
          security, operational, regulatory, and compliance purposes.
          <br />- The Bank reserves the right to block, restrict, or suspend access in case of
          suspected fraud, security threats, or unauthorized activity.
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          6. Transactions &amp; Processing
        </Typography>
        <Typography paragraph>
          - SCF transactions, financing requests, invoice processing, and payments are subject to
          applicable Bank policies, eligibility criteria, contractual terms, and regulatory
          requirements.
          <br />- Invoices, purchase orders, and other documents submitted through the portal may
          be subject to validation, verification, and approval by the Bank or authorized
          participants.
          <br />- Submission of an invoice or financing request does not by itself constitute
          approval or a commitment by the Bank to provide financing.
          <br />- Transactions once submitted, approved, or processed may not be reversible or
          cancellable, subject to the applicable process and Bank policies.
          <br />- The Bank is not liable for delays, rejection, or processing issues resulting from
          incorrect, incomplete, or unauthorized information submitted by users.
          <br />- The Bank may reject, hold, or suspend transactions where discrepancies, fraud
          indicators, compliance concerns, or other exceptions are identified.
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          7. Intellectual Property
        </Typography>
        <Typography paragraph>
          All content, logos, trademarks, software, system designs, workflows, interfaces, and
          other materials available on the SCF Portal are the property of Sample Bank or its
          respective licensors and cannot be copied, reproduced, modified, distributed, or reused
          without prior authorization.
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          8. Limitation of Liability
        </Typography>
        <Typography paragraph>
          The Bank shall not be liable for:
        </Typography>
        <Typography paragraph>
          - System downtime, unavailability, or interruption caused by maintenance, upgrades,
          technical issues, or circumstances beyond the Bank&apos;s reasonable control.
          <br />- Loss or damage resulting from incorrect, incomplete, or unauthorized information
          submitted by users.
          <br />- Loss resulting from user negligence, credential compromise, or failure to follow
          applicable security requirements.
          <br />- Delays or failures caused by third-party service providers, payment networks,
          telecommunications networks, or external systems.
          <br />- Losses arising from cyber-attacks or security incidents beyond the Bank&apos;s
          reasonable control, subject to applicable law.
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          9. Suspension / Termination
        </Typography>
        <Typography paragraph>
          The Bank may suspend, restrict, or terminate access to the SCF Portal:
        </Typography>
        <Typography paragraph>
          - In case of violation of these Terms and Conditions or applicable Bank policies.
          <br />- Where fraudulent, suspicious, unauthorized, or potentially unlawful activity is
          identified.
          <br />- For security, operational, or risk-management reasons.
          <br />- Where required by applicable law, regulatory instructions, or competent
          authorities.
          <br />- Where the user&apos;s eligibility for the relevant SCF program or facility ceases.
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          10. Governing Law
        </Typography>
        <Typography paragraph>
          These Terms and Conditions shall be governed by and interpreted in accordance with
          applicable laws and regulatory requirements, including, where applicable:
        </Typography>
        <Typography paragraph>
          - Information Technology Act, 2000
          <br />- Applicable data protection and privacy laws
          <br />- Applicable regulatory guidelines and directions
          <br />- Applicable banking and financial regulations
          <br />- Other laws and regulations applicable to Supply Chain Finance transactions
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          11. Changes to Terms
        </Typography>
        <Typography paragraph>
          The Bank reserves the right to update or modify these Terms and Conditions at any time
          to reflect changes in applicable laws, regulations, Bank policies, security
          requirements, or portal functionality. Changes may be communicated through the SCF
          Portal or other appropriate channels. Continued use of the portal after such changes
          constitutes acceptance of the revised Terms and Conditions.
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700 }}>
          12. Contact
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

TermsCondition.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
