import { Global, Module } from '@nestjs/common';
import { OpenAiVisionService } from './openai-vision.service';

@Global()
@Module({
  providers: [OpenAiVisionService],
  exports: [OpenAiVisionService],
})
export class OpenAiModule {}
