from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, StrictBool, model_validator


class DrawRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    request_id: UUID
    deck_id: str
    dataset_version: str
    mode: Literal["daily", "past_present_future", "situation_obstacle_advice", "free"]
    count: Annotated[int, Field(strict=True, ge=1, le=10)]
    reversed_enabled: StrictBool
    reversed_probability: Annotated[int, Field(strict=True, ge=0, le=100)]

    @model_validator(mode="after")
    def validate_mode_count(self):
        expected = {"daily": 1, "past_present_future": 3, "situation_obstacle_advice": 3}
        if self.mode in expected and self.count != expected[self.mode]:
            raise ValueError("抽牌数量与牌阵不符")
        return self
