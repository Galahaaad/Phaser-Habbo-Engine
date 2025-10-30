import express from 'express';

const app = express();
const PORT = process.env.PORT || 3001;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'polaris-imager' });
});

app.get('/api/avatar/:figure', async (req, res) => {
  const { figure } = req.params;
  res.status(501).json({
    error: 'Not implemented yet',
    message: `Avatar rendering for figure ${figure} will be implemented using @polaris/renderer`
  });
});

app.get('/api/badge/:code', async (req, res) => {
  const { code } = req.params;
  res.status(501).json({
    error: 'Not implemented yet',
    message: `Badge rendering for ${code} will be implemented`
  });
});

app.get('/api/room/:roomId/snapshot', async (req, res) => {
  const { roomId } = req.params;
  res.status(501).json({
    error: 'Not implemented yet',
    message: `Room snapshot for room ${roomId} will be implemented using @polaris/renderer`
  });
});

app.listen(PORT, () => {
  console.log(`[Polaris Imager] Server running on port ${PORT}`);
  console.log(`[Polaris Imager] Health check: http://localhost:${PORT}/health`);
});
