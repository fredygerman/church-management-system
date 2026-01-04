import * as React from 'react';
import {
  Body,
  Button,
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

interface PasswordResetEmailProps {
  userFirstName: string;
  resetUrl: string;
}

export const PasswordResetEmail = ({
  userFirstName,
  resetUrl,
}: PasswordResetEmailProps): React.ReactElement => (
  <Html>
    <Tailwind>
      <Head>
        <title>Password Reset - Church</title>
        <Preview>Reset your password for Church</Preview>
      </Head>
      <Body className="bg-gray-100 font-sans py-[40px]">
        <Container className="bg-white rounded-[8px] mx-auto p-[32px] max-w-[600px] shadow-sm">
          <Heading className="text-[28px] font-bold text-[#1f2937] m-0 mb-[16px] text-center">
            Password Reset Request
          </Heading>

          <Text className="text-[16px] leading-[24px] text-gray-700 mt-0 mb-[24px]">
            Hi {userFirstName},
          </Text>

          <Text className="text-[16px] leading-[24px] text-gray-700 mt-0 mb-[24px]">
            You requested a password reset for your Church account.
            Click the button below to reset your password:
          </Text>

          <Section className="text-center mb-[32px]">
            <Button
              className="bg-[#ef4444] text-white font-bold py-[14px] px-[32px] rounded-[4px] no-underline text-center"
              href={resetUrl}
            >
              Reset Password
            </Button>
          </Section>

          <Text className="text-[14px] leading-[20px] text-gray-600 mb-[24px]">
            If the button doesn't work, copy and paste this link into your
            browser:
            <br />
            <Link href={resetUrl} className="text-[#3b82f6] break-all">
              {resetUrl}
            </Link>
          </Text>

          <Hr className="border-[#e5e7eb] my-[24px]" />

          <Section className="mb-[24px] bg-[#fef3c7] p-[16px] rounded-[4px]">
            <Text className="text-[14px] leading-[20px] text-[#92400e] m-0">
              <strong>Security Notice:</strong> This link will expire in 1 hour
              for security reasons. If you didn't request this reset, please
              ignore this email.
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

export default PasswordResetEmail;
