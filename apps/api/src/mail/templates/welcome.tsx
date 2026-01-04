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

interface WelcomeEmailProps {
  userFirstName: string;
  dashboardUrl?: string;
}

export const WelcomeEmail = ({
  userFirstName,
  dashboardUrl = 'http://localhost:3000/dashboard',
}: WelcomeEmailProps): React.ReactElement => (
  <Html>
    <Tailwind>
      <Head>
        <title>Welcome to Church</title>
        <Preview>
          Welcome to Church, {userFirstName} - Your  journey
          begins!
        </Preview>
      </Head>
      <Body className="bg-gray-100 font-sans py-[40px]">
  
      </Body>
    </Tailwind>
  </Html>
);

export default WelcomeEmail;
