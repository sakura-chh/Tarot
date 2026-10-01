from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, StrictBool, model_validator


class DrawRequest(BaseModel):
    # 严格类型与未知字段拒绝共同防止隐式转换；问题和笔记不属于接口参数。
    model_config = ConfigDict(extra="forbid")
    request_id: UUID
    deck_id: Annotated[str, Field(min_length=1, max_length=64, pattern=r"^[a-zA-Z0-9_.-]+$")]
    dataset_version: Annotated[
        str, Field(min_length=1, max_length=64, pattern=r"^[a-zA-Z0-9_.-]+$")
    ]
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
