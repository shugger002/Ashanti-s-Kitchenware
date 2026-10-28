import assert from "node:assert/strict";
import { test } from "node:test";
import { barHeight, chartMax, pctChange, shareWidth, sparkPoints } from "./admin-charts";

test("pctChange is null when there is no previous week to compare", () => {
  assert.equal(pctChange(40, 0), null);
  assert.equal(pctChange(0, 0), 0);
  assert.equal(pctChange(120, 100), 20);
  assert.equal(pctChange(80, 100), -20);
});

test("chart scales leave headroom on a round number", () => {
  assert.equal(chartMax([0, 0]), 1);
  assert.equal(chartMax([250]), 300);
  assert.ok(barHeight(50, 100, 80) === 40);
  assert.equal(shareWidth(0, 10), 0);
  assert.equal(shareWidth(5, 10), 50);
});

test("sparkline keeps values as coordinates, not markup", () => {
  const pts = sparkPoints([0, 10], 100, 20, 0);
  assert.equal(pts, "0.0,20.0 100.0,0.0");
});
