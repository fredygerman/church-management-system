import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
  Link,
} from '@react-email/components';

interface OrderConfirmationEmailProps {
  userFirstName: string;
  trackingNumber: string;
  trackingUrl?: string;
}

export const OrderConfirmationEmail = ({
  userFirstName,
  trackingNumber,
  trackingUrl = '#',
}: OrderConfirmationEmailProps): React.ReactElement => (
  <Html>
    <Tailwind>
      <Head>
        <title>Order Confirmed - Church</title>
        <Preview>
          Your shipment has been confirmed - Tracking #{trackingNumber}
        </Preview>
      </Head>
      <Body className="bg-gray-100 font-sans py-[40px]">
        <Container className="bg-white rounded-[8px] mx-auto p-[32px] max-w-[600px] shadow-sm">
          <Heading className="text-[28px] font-bold text-[#059669] m-0 mb-[16px] text-center">
            Order Confirmed! 🚚
          </Heading>

          <Text className="text-[16px] leading-[24px] text-gray-700 mt-0 mb-[24px]">
            Hi {userFirstName},
          </Text>

          <Text className="text-[16px] leading-[24px] text-gray-700 mt-0 mb-[24px]">
            Your shipment has been confirmed and is being processed by our
             team.
          </Text>

          <Section className="bg-[#f0f9ff] p-[20px] rounded-[8px] mb-[24px] border border-[#0ea5e9]">
            <Heading className="text-[20px] font-bold text-[#0c4a6e] mb-[12px] m-0">
              📦 Tracking Information
            </Heading>
            <Text className="text-[16px] text-[#0c4a6e] m-0 mb-[8px]">
              <strong>Tracking Number:</strong> {trackingNumber}
            </Text>
            <Link
              href={trackingUrl}
              className="text-[#0ea5e9] font-medium underline"
            >
              Track your shipment →
            </Link>
          </Section>

          <Section className="mb-[24px]">
            <Heading className="text-[18px] font-bold text-gray-800 mb-[12px]">
              What's Next?
            </Heading>
            <ul className="list-disc pl-[20px] text-gray-700">
              <li className="mt-[8px]">
                We'll keep you updated on your shipment's progress
              </li>
              <li className="mt-[8px]">
                You can track your package anytime using the tracking number
                above
              </li>
              <li className="mt-[8px]">
                You'll receive notifications for important delivery updates
              </li>
            </ul>
          </Section>

          <Hr className="border-[#e5e7eb] my-[24px]" />

          <Section className="mb-[24px]">
            <Heading className="text-[18px] font-bold text-gray-800 mb-[12px]">
              Questions?
            </Heading>
            <Text className="text-[14px] leading-[20px] text-gray-700">
              If you have any questions about your shipment, please contact our
              support team at{' '}
              <Link
                href="mailto:support@church.org"
                className="text-[#3b82f6]"
              >
                support@church.org
              </Link>
            </Text>
          </Section>

          <Text className="text-[12px] text-gray-500 text-center">
            © 2024 Church. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default OrderConfirmationEmail;
