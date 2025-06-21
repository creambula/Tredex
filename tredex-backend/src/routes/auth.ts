import express from 'express';
import type { Request, Response, Router } from 'express';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const router: Router = express.Router();
const prisma = new PrismaClient();

const CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI!;

router.get('/discord', (req, res) => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'identify',
  });

  res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
});

router.get('/discord/callback', async (req, res) => {
  const code = req.query.code as string;

  const tokenRes = await axios.post(
    'https://discord.com/api/oauth2/token',
    new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      scope: 'identify',
    }),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }
  );

  const userRes = await axios.get('https://discord.com/api/users/@me', {
    headers: {
      Authorization: `Bearer ${tokenRes.data.access_token}`,
    },
  });

  const { id, username, avatar } = userRes.data;

  const user = await prisma.user.upsert({
    where: { discordId: id },
    update: {},
    create: {
      discordId: id,
      username,
      avatarUrl: `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`,
    },
  });

  res.cookie('user_id', user.id, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.redirect('http://localhost:5173/auth/callback');
});

router.get('/me', async (req: Request, res: Response): Promise<void> => {
  const userId = req.cookies.user_id;
  if (!userId) {
    res.status(401).json({ error: 'Not logged in' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      positions: true, // Use lowercase 'positions' to match schema
    },
  });

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json(user);
});

export default router;