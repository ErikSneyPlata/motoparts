-- PostgreSQL trigram indexes accelerate contains/ILIKE searches used by search panels.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "Part_name_trgm_idx" ON "Part" USING GIN ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Part_sku_trgm_idx" ON "Part" USING GIN ("sku" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Part_oemCode_trgm_idx" ON "Part" USING GIN ("oemCode" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Part_brandName_trgm_idx" ON "Part" USING GIN ("brandName" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Part_ean13_trgm_idx" ON "Part" USING GIN ("ean13" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "MotorcycleModel_name_trgm_idx" ON "MotorcycleModel" USING GIN ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Brand_name_trgm_idx" ON "Brand" USING GIN ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "RepairOrder_plate_trgm_idx" ON "RepairOrder" USING GIN ("plate" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "RepairOrder_code_trgm_idx" ON "RepairOrder" USING GIN ("code" gin_trgm_ops);
