#!/bin/bash
rm -rf dist
pnpm tsc
cp .env dist/
