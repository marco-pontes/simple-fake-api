#!/usr/bin/env node

import { start, initialize } from '@/index.js';

await initialize();
start();
