# Illustrative payment requirements

A Finance Maker can search for an unpaid payslip and submit a Mark as Paid request. Paid payslips cannot be submitted again.
Payment method and payment date are mandatory before a request is submitted. A payment date must be a valid calendar date.
For a payslip amount greater than zero, payment method lists bank names only. For a zero amount, it lists Previous Advance, Scholarship & Waiver, and Semester Drop.
A duplicate transaction ID for the same bank must be blocked before submission, with a failure recorded in the audit log.
A Finance Checker can approve or reject a submitted request. The Maker cannot approve their own request.
A payslip becomes Paid only after the required approval is complete. Until then, its payment status remains Unpaid.
A rejected request remains Unpaid and returns to the Maker for correction and resubmission. A rejection reason is mandatory.
The system records submissions, approval decisions, and validation failures with the actor, timestamp, payslip number, and changed values in an audit log.
